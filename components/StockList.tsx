
import React, { useState, useMemo } from 'react';
import type { StockItem } from '../types';

interface StockListProps {
    items: StockItem[];
    onSelectItem: (item: StockItem) => void;
    onDeleteItem: (item: StockItem) => void;
}

const StockList: React.FC<StockListProps> = ({ items, onSelectItem, onDeleteItem }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const brands = useMemo(() => {
        const brandSet = new Set<string>();
        items.forEach(item => brandSet.add(item.marca));
        return Array.from(brandSet).sort((a, b) => a.localeCompare(b));
    }, [items]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return [];
        const lowercasedQuery = searchQuery.toLowerCase().trim();
        return items.filter(
            item =>
                String(item.marca).toLowerCase().includes(lowercasedQuery) ||
                String(item.modelo).toLowerCase().includes(lowercasedQuery)
        );
    }, [items, searchQuery]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleBrandClick = (brandName: string) => {
        setSearchQuery(brandName);
    };

    const renderDefaultView = () => (
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Marcas Disponíveis</h3>
            {brands.length === 0 ? (
                <div className="text-center text-gray-500 py-10 px-6 bg-gray-50 rounded-lg">
                    <p className="font-semibold">Nenhum item em estoque.</p>
                    <p className="text-sm">Clique no botão '+' para adicionar um novo item e começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {brands.map(brand => (
                        <button
                            key={brand}
                            onClick={() => handleBrandClick(brand)}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-500 transition-all text-center font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSearchResults = () => (
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Detalhes</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                           Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{item.marca}</div>
                                <div className="text-sm text-gray-500">{item.modelo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <div className="text-sm text-gray-900">Tamanho: {item.tamanho}</div>
                                <div className="text-sm text-gray-500">Cor: {item.cor}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 font-bold">{item.quantidade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => onSelectItem(item)} className="p-2 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors" aria-label="Editar item" title="Editar item">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2