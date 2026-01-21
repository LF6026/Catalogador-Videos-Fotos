'use client';

import React, { useRef } from 'react';
import { Camera, Grid, Star, Download, FolderInput, FileSpreadsheet, BarChart3, MapPin, Tag, Type } from 'lucide-react';
import { CAMERA_MODELS } from '../../utils/parsers';
import { CatalogStats } from '../../types';

interface SidebarProps {
    cameraModel: string;
    setCameraModel: (model: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    filterCamera: string;
    setFilterCamera: (camera: string) => void;
    stats: CatalogStats;
    onExportJSON: () => void;
    onExportCSV: () => void;
    onImportCatalog: (files: FileList) => void;
}

export default function StudioSidebar({
    cameraModel,
    setCameraModel,
    filterType,
    setFilterType,
    filterCamera,
    setFilterCamera,
    stats,
    onExportJSON,
    onExportCSV,
    onImportCatalog
}: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${isActive
            ? 'bg-indigo-500/10 text-indigo-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`;

    // Get unique cameras from stats
    const camerasInUse = Object.keys(stats.byCamera).filter(c => c !== 'Desconhecida');

    return (
        <div className="flex flex-col h-full p-4">
            {/* App Header */}
            <div className="mb-6 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    CATALOGADOR
                </div>
            </div>

            {/* Camera Context */}
            <div className="mb-6">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                    Câmera Ativa
                </label>
                <select
                    value={cameraModel}
                    onChange={(e) => setCameraModel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                    <option value="">Selecione...</option>
                    {CAMERA_MODELS.map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                </select>
            </div>

            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                    Biblioteca
                </label>

                <div className={navItemClass(filterType === 'all')} onClick={() => { setFilterType('all'); setFilterCamera(''); }}>
                    <Grid className="w-4 h-4" />
                    <span>Todos os Vídeos</span>
                    <span className="ml-auto text-xs text-slate-600">{stats.total}</span>
                </div>

                <div className={navItemClass(filterType === 'auto-only')} onClick={() => setFilterType('auto-only')}>
                    <Camera className="w-4 h-4" />
                    <span>Identificados (Auto)</span>
                </div>

                <div className={navItemClass(filterType === 'missing-title')} onClick={() => setFilterType('missing-title')}>
                    <Star className="w-4 h-4" />
                    <span>Sem Título</span>
                    {stats.total - stats.withTitle > 0 && (
                        <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                            {stats.total - stats.withTitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Filter by Camera */}
            {camerasInUse.length > 0 && (
                <div className="mb-6">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                        Filtrar por Câmera
                    </label>
                    <div className="space-y-1">
                        {camerasInUse.map(cam => (
                            <div
                                key={cam}
                                className={navItemClass(filterCamera === cam)}
                                onClick={() => setFilterCamera(filterCamera === cam ? '' : cam)}
                            >
                                <Camera className="w-4 h-4" />
                                <span className="truncate">{cam}</span>
                                <span className="ml-auto text-xs text-slate-600">{stats.byCamera[cam]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Statistics */}
            {stats.total > 0 && (
                <div className="mb-6 px-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3 block flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Estatísticas
                    </label>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1.5">
                                <Type className="w-3 h-3" /> Com título
                            </span>
                            <span className="text-slate-300">
                                {stats.withTitle}/{stats.total}
                                <span className="text-slate-600 ml-1">
                                    ({Math.round((stats.withTitle / stats.total) * 100)}%)
                                </span>
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1">
                            <div
                                className="bg-emerald-500 h-1 rounded-full transition-all"
                                style={{ width: `${(stats.withTitle / stats.total) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs mt-3">
                            <span className="text-slate-500 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3" /> Com local
                            </span>
                            <span className="text-slate-300">
                                {stats.withLocation}/{stats.total}
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1">
                            <div
                                className="bg-blue-500 h-1 rounded-full transition-all"
                                style={{ width: `${(stats.withLocation / stats.total) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs mt-3">
                            <span className="text-slate-500 flex items-center gap-1.5">
                                <Tag className="w-3 h-3" /> Com tags
                            </span>
                            <span className="text-slate-300">
                                {stats.withTags}/{stats.total}
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1">
                            <div
                                className="bg-purple-500 h-1 rounded-full transition-all"
                                style={{ width: `${(stats.withTags / stats.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-auto space-y-2 pt-4 border-t border-slate-800">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                    Ações
                </label>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    multiple
                    onChange={(e) => e.target.files && onImportCatalog(e.target.files)}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                    <FolderInput className="w-4 h-4" />
                    <span>Importar JSON</span>
                </button>

                <button
                    onClick={onExportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>Exportar JSON</span>
                </button>

                <button
                    onClick={onExportCSV}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar CSV</span>
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                    <span>v2.2</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online"></div>
                </div>
            </div>
        </div>
    );
}
