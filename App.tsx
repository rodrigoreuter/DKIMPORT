
import React, { useState, useEffect } from 'react';
import type { StockItem, FormState, ApiAction } from './types';
import StockForm from './components/StockForm';
import StockList from './components/StockList';
import LoadingSpinner from './components/LoadingSpinner';
import Instructions from './components/Instructions';

// =================================================================================
// !!! IMPORTANTE: COLE A URL DO SEU APLICATIVO DA WEB DO GOOGLE APPS SCRIPT AQUI !!!
// =================================================================================
// Siga as instruções no "Guia de Configuração Rápida" para obter esta URL.
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwwx1kolA2K7uKbezYo7W99TbAhsSvGeqcvlJwVsZOTsc1DfCcbOKxbcDcgOi2aTOHo/exec" // Ex: "https://script.google.com/macros/s/ABCD.../exec"
// =================================================================================

const App: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  const callApi = async (action: ApiAction, data?: any): Promise<StockItem[]> => {
    if (!GAS_WEB_APP_URL) {
      throw new Error("A URL do Google Apps Script não foi configurada. Siga as instruções abaixo.");
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = JSON.stringify({ action, data });
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ payload }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resposta de erro do servidor:", errorText);
        throw new Error(`Erro de rede: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Erro no backend: ${result.error}`);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const result = await callApi('getItems');
      setStockItems(result.sort((a, b) => a.marca.localeCompare(b.marca)));
    } catch (e: any) {
      setError(e.message);
      setStockItems([]);
    }
  };

  useEffect(() => {
    if (GAS_WEB_APP_URL) {
      fetchItems();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleFormAction = async (action: 'addItem' | 'updateItem', formData: FormState) => {
    const isAdding = action === 'addItem';
    const id = isAdding
      ? `${formData.marca}-${formData.modelo}-${formData.tamanho}-${formData.cor}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      : selectedItem!.id;

    const payloadData = {
      ...formData,
      id,
      quantidade: Number(formData.quantidade) || 0,
    };
    
    try {
      const result = await callApi(action, payloadData);
      setStockItems(result.sort((a, b) => a.marca.localeCompare(b.marca)));
      handleCloseForm();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteItem = async (itemToDelete: StockItem) => {
      if (!window.confirm("Tem certeza que deseja apagar este item?")) {
        return;
      }
      
      const payloadData = { 
        id: itemToDelete.id,
        marca: itemToDelete.marca,
        modelo: itemToDelete.modelo,
        tamanho: itemToDelete.tamanho,
        cor: itemToDelete.cor,
      };

    try {
      const result = await callApi('deleteItem', payloadData);
      setStockItems(result.sort((a, b) => a.marca.localeCompare(b.marca)));
      if (selectedItem?.id === itemToDelete.id) {
          handleCloseForm();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };


  const handleSelectItemForEdit = (item: StockItem) => {
    setSelectedItem(item);
    setIsFormVisible(true);
  };
  
  const handleOpenFormForAdd = () => {
    setSelectedItem(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    // Pequeno delay para a animação de saída do modal antes de limpar os dados
    setTimeout(() => {
        setSelectedItem(null);
    }, 300);
  };

  const handleRefresh = () => {
    if (GAS_WEB_APP_URL) {
      fetchItems();
    }
  };

  const renderContent = () => {
    // Spinner de carregamento inicial (tela inteira)
    if (isLoading && stockItems.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <strong className="font-bold">Ocorreu um erro:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      );
    }

    return <StockList items={stockItems} onSelectItem={handleSelectItemForEdit} onDeleteItem={handleDeleteItem} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Controle de Estoque
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            DK IMPORT
          </p>
        </header>

        {!GAS_WEB_APP_URL ? (
            <Instructions />
        ) : (
          <main className="flex flex-col gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Estoque</h2>
                <button 
                  onClick={handleRefresh} 
                  disabled={isLoading} 
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label="Atualizar lista"
                  title="Atualizar lista"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M14.5,3.47L14.5,5.53C13.23,4.56 11.7,4 10,4C5.58,4 2,7.58 2,12C2,16.42 5.58,20 10,20C14.42,20 18,16.42 18,12C18,11.23 17.89,10.49 17.7,9.79L19.74,9.79C19.9,10.49 20,11.23 20,12C20,17.52 15.52,22 10,22C4.48,22 0,17.52 0,12C0,6.48 4.48,2 10,2C11.94,2 13.73,2.67 15.15,3.85L15.15,2L19,5.85L15.15,9.7L14.5,9.14L14.5,3.47Z" stroke="none" fill="currentColor"/>
                    </svg>
                </button>
              </div>
              <div className="relative">
                {/* Spinner de carregamento para refresh */}
                {isLoading && stockItems.length > 0 && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <LoadingSpinner />
                  </div>
                )}
                {renderContent()}
              </div>
            </div>
            
            {/* Botão Flutuante para Adicionar Item */}
            <button
                onClick={handleOpenFormForAdd}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform hover:scale-110"
                aria-label="Adicionar novo item"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>
            
            {/* Modal do Formulário */}
            {isFormVisible && (
                <div 
                    role="dialog" 
                    aria-modal="true" 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-end"
                    onClick={handleCloseForm} // Fecha ao clicar no fundo
                >
                    <div 
                        className={`bg-white w-full max-w-lg rounded-t-2xl shadow-xl transition-transform duration-300 ease-in-out transform ${isFormVisible ? 'translate-y-0' : 'translate-y-full'}`}
                        onClick={(e) => e.stopPropagation()} // Evita que o clique dentro do form feche o modal
                    >
                         <StockForm
                            onAction={handleFormAction}
                            selectedItem={selectedItem}
                            onClear={handleCloseForm}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
