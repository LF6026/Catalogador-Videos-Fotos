import React, { useRef } from 'react';
import { Camera, Grid, Star, Settings, Upload, Download, FolderInput } from 'lucide-react';

interface SidebarProps {
    cameraModel: string;
    setCameraModel: (model: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    totalVideos: number;
    onExportJSON: () => void;
    onImportCatalog: (files: FileList) => void;
}

export default function StudioSidebar({
    cameraModel,
    setCameraModel,
    filterType,
    setFilterType,
    totalVideos,
    onExportJSON,
    onImportCatalog
}: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItemClass = (isActive: boolean) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${isActive
            ? 'bg-indigo-500/10 text-indigo-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`;

    return (
        <div className="flex flex-col h-full p-4">
            {/* App Header */}
            <div className="mb-8 px-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-tight">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    CATALOGADOR
                </div>
            </div>

            {/* Camera Context */}
            <div className="mb-8">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                    Câmera Ativa
                </label>
                <div className="relative">
                    <select
                        value={cameraModel}
                        onChange={(e) => setCameraModel(e.target.value)}
                        className="w-full bg-slate-800 border-none text-slate-200 text-sm rounded-lg px-3 py-2 appearance-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="">Selecione...</option>
                        <option value="Insta360 X5">Insta360 X5</option>
                        <option value="Insta360 X4">Insta360 X4</option>
                        <option value="Insta360 X3">Insta360 X3</option>
                        <option value="GoPro Hero">GoPro Hero</option>
                        <option value="DJI Osmo">DJI Osmo</option>
                        <option value="Sony Alpha">Sony Alpha</option>
                    </select>
                    <Settings className="w-3 h-3 absolute right-3 top-3 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Main Navigation */}
            <div className="space-y-1 mb-8">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block px-2">
                    Biblioteca
                </label>

                <div className={navItemClass(filterType === 'all')} onClick={() => setFilterType('all')}>
                    <Grid className="w-4 h-4" />
                    <span>Todos os Vídeos</span>
                    <span className="ml-auto text-xs text-slate-600">{totalVideos}</span>
                </div>

                <div className={navItemClass(filterType === 'auto-only')} onClick={() => setFilterType('auto-only')}>
                    <Camera className="w-4 h-4" />
                    <span>Identificados (Auto)</span>
                </div>
            </div>

            {/* Secondary Nav */}
            <div className="space-y-1 mb-8">
                <div className={navItemClass(filterType === 'missing-title')} onClick={() => setFilterType('missing-title')}>
                    <Star className="w-4 h-4" />
                    <span>Sem Metadados</span>
                </div>
            </div>

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
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                    <span>v2.1 Studio</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online"></div>
                </div>
            </div>
        </div>
    );
}
