import React, { useState } from 'react';

const Instructions: React.FC = () => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar Código');

    const appsScriptCode = `
// ========================================================================== //
//      CÓDIO DO GOOGLE APPS SCRIPT PARA O CONTROLE DE ESTOQUE (V9.3)        //
// ========================================================================== //
// INSTRUÇÕES:
// 1. CORREÇÃO (V9.3): A busca de itens para apagar/atualizar foi TOTALMENTE
//    reescrita para usar o ID único do item. Isso corrige o bug em que
//    itens não eram apagados e torna a operação 100% confiável.
// 2. O script continua consolidando itens de todas as abas e criando
//    novas abas para novas marcas automaticamente.
// ========================================================================== //


const SHEET_ID = "1iOrqgqN3fkFnLV9q0d1e3oJynpUES_bbTMywxTFee2M";

const ID_COL = "ID";
const MARCA_COL = "MARCA";
const MODELO_COL = "MODELO";
const TAMANHO_COL = "TAMANHO";
const COR_COL = "COR";
const QUANTIDADE_COL = "QUANTIDADE";

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createJsonResponse({
    status: "success",
    message: "O endpoint da API de Controle de Estoque está ativo."
  });
}

function doPost(e) {
  if (!e || !e.parameter || !e.parameter.payload) {
    return createJsonResponse({ error: "Requisição inválida." });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    const payload = JSON.parse(e.parameter.payload);
    const action = payload.action;
    const data = payload.data;

    let result;
    switch (action) {
      case 'getItems':
        result = getItems(spreadsheet);
        break;
      case 'addItem':
        result = addItem(spreadsheet, data);
        break;
      case 'updateItem':
        result = updateItem(spreadsheet, data);
        break;
      case 'deleteItem':
        result = deleteItem(spreadsheet, data);
        break;
      default:
        throw new Error("Ação desconhecida: " + action);
    }
    return createJsonResponse(result);
  } catch (error) {
    Logger.log('Erro: ' + error.toString() + '\\nStack: ' + error.stack);
    return createJsonResponse({ error: 'Erro no servidor: ' + error.message });
  } finally {
    lock.releaseLock();
  }
}

// Função robusta para encontrar o índice da coluna ignorando maiúsculas/minúsculas.
function getColIndexByName(headers, colName) {
  const upperCaseHeaders = headers.map(function(h) { return String(h || '').toUpperCase().trim(); });
  const upperCaseColName = colName.toUpperCase().trim();
  const index = upperCaseHeaders.indexOf(upperCaseColName);
  if (index === -1) {
    throw new Error('Coluna "' + colName + '" não encontrada. Verifique os cabeçalhos da sua planilha.');
  }
  return index; // return 0-based index
}

function generateId(marca, modelo, tamanho, cor) {
    const marcaStr = String(marca || '');
    const modeloStr = String(modelo || '');
    const tamanhoStr = String(tamanho || '');
    const corStr = String(cor || '');
    
    return (marcaStr + "-" + modeloStr + "-" + tamanhoStr + "-" + corStr)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

function sheetDataToJSON(data, headers) {
    const colIndices = {
        id: getColIndexByName(headers, ID_COL),
        marca: getColIndexByName(headers, MARCA_COL),
        modelo: getColIndexByName(headers, MODELO_COL),
        tamanho: getColIndexByName(headers, TAMANHO_COL),
        cor: getColIndexByName(headers, COR_COL),
        quantidade: getColIndexByName(headers, QUANTIDADE_COL)
    };

    return data
        .filter(row => row[colIndices.marca] && String(row[colIndices.marca]).trim() !== '')
        .map(row => {
            const marca = String(row[colIndices.marca] || '');
            const modelo = String(row[colIndices.modelo] || '');
            const tamanho = String(row[colIndices.tamanho] || '');
            const cor = String(row[colIndices.cor] || '');

            let id = row[colIndices.id];
            if (!id || String(id).trim() === '') {
                id = generateId(marca, modelo, tamanho, cor);
            }

            return {
                id: String(id),
                marca: marca,
                modelo: modelo,
                tamanho: tamanho,
                cor: cor,
                quantidade: parseInt(row[colIndices.quantidade], 10) || 0,
            };
        });
}

function getItems(spreadsheet) {
    const sheets = spreadsheet.getSheets();
    const aggregatedItems = {};

    sheets.forEach(function(sheet) {
        const range = sheet.getDataRange();
        const values = range.getValues();
        if (values.length < 2) return;

        const headers = values.shift();
        const items = sheetDataToJSON(values, headers);

        items.forEach(function(item) {
            if (item && item.id) {
                if (aggregatedItems[item.id]) {
                    aggregatedItems[item.id].quantidade += item.quantidade;
                } else {
                    aggregatedItems[item.id] = item;
                }
            }
        });
    });

    return Object.keys(aggregatedItems).map(function(key) {
      return aggregatedItems[key];
    });
}

function findRowIndexByFields(values, item, headers) {
    const colIndices = {
        marca: getColIndexByName(headers, MARCA_COL),
        modelo: getColIndexByName(headers, MODELO_COL),
        tamanho: getColIndexByName(headers, TAMANHO_COL),
        cor: getColIndexByName(headers, COR_COL),
    };

    for (var i = 0; i < values.length; i++) {
        var row = values[i];
        
        const sheetMarca = String(row[colIndices.marca] || '').trim().toLowerCase();
        const itemMarca = String(item.marca || '').trim().toLowerCase();
        const sheetModelo = String(row[colIndices.modelo] || '').trim().toLowerCase();
        const itemModelo = String(item.modelo || '').trim().toLowerCase();
        const sheetTamanho = String(row[colIndices.tamanho] || '').trim().toLowerCase();
        const itemTamanho = String(item.tamanho || '').trim().toLowerCase();
        const sheetCor = String(row[colIndices.cor] || '').trim().toLowerCase();
        const itemCor = String(item.cor || '').trim().toLowerCase();

        if (sheetMarca === itemMarca && sheetModelo === itemModelo && sheetTamanho === itemTamanho && sheetCor === itemCor) {
            return i;
        }
    }
    return -1;
}

function addItem(spreadsheet, item) {
    const brandName = item.marca;
    if (!brandName || String(brandName).trim() === '') {
        throw new Error("A marca é obrigatória para adicionar um item.");
    }

    let targetSheet = spreadsheet.getSheetByName(brandName);
    if (!targetSheet) {
        targetSheet = spreadsheet.insertSheet(brandName);
        const firstSheet = spreadsheet.getSheets()[0];
        if (firstSheet.getLastRow() >= 1) {
            firstSheet.getRange(1, 1, 1, firstSheet.getLastColumn()).copyTo(targetSheet.getRange(1, 1));
        } else {
            targetSheet.getRange(1, 1, 1, 6).setValues([[ID_COL, MARCA_COL, MODELO_COL, TAMANHO_COL, COR_COL, QUANTIDADE_COL]]);
        }
    }

    const range = targetSheet.getDataRange();
    const values = range.getValues();
    const headers = values.length > 0 ? values[0] : [];
    const dataValues = values.slice(1);

    if (findRowIndexByFields(dataValues, item, headers) !== -1) {
        throw new Error("Este item (marca, modelo, tamanho, cor) já existe na aba '" + brandName + "'. Para alterar a quantidade, use a função de edição.");
    }

    const newRow = headers.map(function(header) {
        const key = String(header).toLowerCase().trim();
        if (key === 'id') return String(item.id);
        if (key === 'marca') return item.marca;
        if (key === 'modelo') return item.modelo;
        if (key === 'tamanho') return item.tamanho;
        if (key === 'cor') return item.cor;
        if (key === 'quantidade') return Number(item.quantidade);
        return "";
    });

    targetSheet.appendRow(newRow);
    return getItems(spreadsheet);
}


// Função REESCRITA para encontrar um item PELO ID e executar uma ação.
function findItemByIdAndExecute(spreadsheet, item, actionCallback) {
  const sheets = spreadsheet.getSheets();
  let itemFoundAndActioned = false;

  const idToFind = String(item.id || '').trim();
  if (!idToFind) {
    throw new Error("O item não possui um ID. Não é possível realizar a operação.");
  }

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const range = sheet.getDataRange();
    const values = range.getValues();
    if (values.length < 2) continue; // Pula abas vazias ou só com cabeçalho

    const headers = values.shift(); // Remove headers, values agora é só dados
    const idColIndex = getColIndexByName(headers, ID_COL);

    for (let j = values.length - 1; j >= 0; j--) { // Itera de trás para frente para evitar problemas ao apagar
      const row = values[j];
      const sheetId = String(row[idColIndex] || '').trim();

      if (sheetId === idToFind) {
        // Encontrou pelo ID!
        const rowIndexInSheet = j + 2; // j é 0-based, +1 para compensar o header, +1 porque linhas são 1-based
        actionCallback(sheet, rowIndexInSheet, headers, item);
        itemFoundAndActioned = true;
        break; 
      }
    }
    if (itemFoundAndActioned) break; 
  }

  if (!itemFoundAndActioned) {
    throw new Error("O item com ID '" + idToFind + "' não foi encontrado. Tente atualizar a página.");
  }
}

function updateItem(spreadsheet, item) {
  findItemByIdAndExecute(spreadsheet, item, function(sheet, rowIndex, headers, itemData) {
    const quantidadeCol = getColIndexByName(headers, QUANTIDADE_COL) + 1;
    sheet.getRange(rowIndex, quantidadeCol).setValue(itemData.quantidade);
  });
  return getItems(spreadsheet);
}

function deleteItem(spreadsheet, item) {
  findItemByIdAndExecute(spreadsheet, item, function(sheet, rowIndex) {
    sheet.deleteRow(rowIndex);
  });
  return getItems(spreadsheet);
}
`;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(appsScriptCode.trim())
            .then(() => {
                setCopyButtonText('Copiado!');
                setTimeout(() => setCopyButtonText('Copiar Código'), 2000);
            })
            .catch(err => {
                console.error('Falha ao copiar o código: ', err);
                setCopyButtonText('Erro ao copiar');
                setTimeout(() => setCopyButtonText('Copiar Código'), 2000);
            });
    };

    return (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-8 text-sm text-gray-700 space-y-6" role="region" aria-label="Instruções de Configuração">
            <h3 className="text-xl font-bold text-gray-900">Guia de Configuração Rápida</h3>
            
            <div>
                <h4 className="font-bold text-gray-800 text-base mb-2">Passo 1: Criar a Planilha Google</h4>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                    <li>Acesse <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">sheets.new</a> para criar uma nova planilha.</li>
                    <li>
                        Na primeira linha da primeira aba (que servirá de modelo), crie as colunas EXATAMENTE como no exemplo abaixo:
                        <div className="my-2 font-mono text-indigo-800 bg-indigo-50 p-2 rounded text-center text-xs sm:text-sm">
                            ID | MARCA | MODELO | TAMANHO | COR | QUANTIDADE
                        </div>
                        <p className="text-xs text-gray-600">
                            <strong>Importante:</strong> A coluna 'ID' é essencial e será preenchida automaticamente. Outras abas serão criadas automaticamente quando você adicionar novas marcas.
                        </p>
                    </li>
                </ol>
            </div>

            <div>
                <h4 className="font-bold text-gray-800 text-base mb-2">Passo 2: Criar o Google Apps Script (Versão 9.3 - CORREÇÃO IMPORTANTE)</h4>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                    <li>Na planilha, vá em "Extensões" &gt; "Apps Script".</li>
                    <li>Apague o conteúdo padrão do arquivo <code>Code.gs</code>.</li>
                    <li>
                        Copie o código abaixo e cole no editor do Apps Script.
                        <div className="my-2 p-3 rounded-md bg-yellow-100 border border-yellow-300">
                           <p className="font-bold text-yellow-800 text-center">
                                ATENÇÃO: O ID da sua planilha já foi inserido no código abaixo. Apenas copie e cole.
                           </p>
                        </div>
                        <div className="relative mt-2">
                            <textarea
                                readOnly
                                value={appsScriptCode.trim()}
                                className="w-full h-48 p-2 font-mono text-xs bg-gray-900 text-gray-100 rounded-md border border-gray-700 resize-none"
                                aria-label="Código do Google Apps Script"
                            />
                            <button
                                onClick={handleCopyCode}
                                className="absolute top-2 right-2 bg-gray-700 text-white px-3 py-1 text-xs font-semibold rounded hover:bg-gray-600 transition-colors"
                            >
                                {copyButtonText}
                            </button>
                        </div>
                    </li>
                     <li className="p-3 rounded-md bg-green-100 border border-green-300">
                        <strong className="text-green-800">Tudo certo!</strong> O ID da sua planilha já está no código. Você não precisa mais fazer a substituição manual.
                     </li>
                    <li>Salve o projeto (ícone de disquete).</li>
                </ol>
            </div>

            <div>
                <h4 className="font-bold text-gray-800 text-base mb-2">Passo 3: Implantar o Script (O Passo Mais Importante!)</h4>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                    <li>Clique em "Implantar" &gt; "Nova implantação".</li>
                    <li>Selecione o tipo: "Aplicativo da Web".</li>
                    <li>Em "Quem pode acessar", selecione <strong>"Qualquer pessoa"</strong>.</li>
                    <li>Clique em "Implantar" e autorize o acesso (pode ser necessário clicar em "Avançado" e "Acessar... (não seguro)").</li>
                    <li>Copie a "URL do aplicativo da web" fornecida.</li>
                     <li className="p-3 rounded-md bg-red-100 border border-red-300">
                        <strong className="text-red-700">MUITO IMPORTANTE:</strong> Se você fizer QUALQUER alteração no código do script, você precisa fazer uma <strong>"Nova implantação"</strong> novamente para que as mudanças funcionem! Apenas salvar não é suficiente.
                     </li>
                </ol>
            </div>

            <div>
                <h4 className="font-bold text-gray-800 text-base mb-2">Passo 4: Configurar o Frontend</h4>
                <ol className="list-decimal list-inside pl-4">
                    <li>No código-fonte deste app, abra o arquivo <code>App.tsx</code>.</li>
                    <li>Encontre a variável <code>GAS_WEB_APP_URL</code> no topo do arquivo.</li>
                    <li>Cole a URL que você copiou no passo anterior entre as aspas.</li>
                </ol>
            </div>
        </div>
    );
};

export default Instructions;
