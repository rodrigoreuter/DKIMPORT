
import React, { useState, useEffect } from 'react';
import type { FormState, StockItem } from '../types';

interface StockFormProps {
    onAction: (action: 'addItem' | 'updateItem', data: FormState) => void;
    selectedItem: StockItem | null;
    onClear: () => void;
    isLoading: boolean;
}

const initialFormState: FormState = {
    marca: '',
    modelo: '',
    tamanho: '',
    cor: '',
    quantidade: '',
};

const StockForm: React.FC<StockFormProps> = ({ onAction, selectedItem, onClear, isLoading }) => {
    const [form, setForm] = useState<FormState>(initialFormState);
    const isEditing = !!selectedItem;

    useEffect(() => {
        if (selectedItem) {
            setForm({
                marca: selectedItem.marca,
                modelo: selectedItem.modelo,
                tamanho: selectedItem.tamanho,
                cor: selectedItem.cor,
                quantidade: String(selectedItem.quantidade),
            });
        } else {
            setForm(initialFormState);
        }
    }, [selectedItem]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAction = (action: 'addItem' | 'updateItem') => (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.marca || !form.modelo || !form.tamanho || !form.cor || form.quantidade === '') {
            alert('Marca, Modelo, Tamanho, Cor e Quantidade são obrigatórios.');
            return;
        }
        onAction(action, form);
    };

    return (
        <div id="stock-form" className="p-6">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
                <button onClick={onClear} className="p-2 rounded-full hover:bg-gray-200" aria-label="Fechar formulário">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            <form className="space-y-4" onSubmit={handleAction(isEditing ? 'updateItem' : 'addItem')}>
                <div>
                    <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
                    <input
                        type="text"
                        name="marca"
                        id="marca"
                        value={form.marca}
                        onChange={handleChange}
                        disabled={isEditing || isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
                    <input
                        type="text"
                        name="modelo"
                        id="modelo"
                        value={form.modelo}
                        onChange={handleChange}
                        disabled={isEditing || isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="tamanho" className="block text-sm font-medium text-gray-700">Tamanho</label>
                    <input
                        type="text"
                        name="tamanho"
                        id="tamanho"
                        value={form.tamanho}
                        onChange={handleChange}
                        disabled={isEditing || isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="cor" className="block text-sm font-medium text-gray-700">Cor</label>
                    <input
                        type="text"
                        name="cor"
                        id="cor"
                        value={form.cor}
                        onChange={handleChange}
                        disabled={isEditing || isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                        type="number"
                        name="quantidade"
                        id="quantidade"
                        value={form.quantidade}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        min="0"
                    />
                </div>
                <div className="pt-2 space-y-3">
                    {isEditing ? (
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait">
                            {isLoading ? 'Atualizando...' : 'Atualizar Quantidade'}
                        </button>
                    ) : (
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-wait">
                            {isLoading ? 'Adicionando...' : 'Adicionar Novo Item'}
                        </button>
                    )}
                     <button type="button" onClick={onClear} disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockForm;
