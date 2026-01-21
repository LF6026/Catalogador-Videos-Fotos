import React, { useEffect, useState } from 'react';
import { Camera, FolderOpen, Video, Moon, Sun } from 'lucide-react';
import { CAMERA_MODELS } from '../utils/parsers';

interface HeaderProps {
    cameraModel: string;
    setCameraModel: (model: string) => void;
    onToggleDarkMode: () => void;
}

export default function Header({
    cameraModel,
    setCameraModel,
    onToggleDarkMode
}: HeaderProps) {
    const [isDark, setIsDark] = useState(false);

    // Sync local state with actual class for icon switch
    useEffect(() => {
        // specific check for hydration
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const handleToggle = () => {
        onToggleDarkMode();
        setIsDark(!isDark);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Catalogador de Vídeos</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie e organize sua biblioteca de mídias</p>
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Alternar Modo Escuro"
                >
                    {isDark ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-slate-600" />}
                </button>
            </div>

            <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Como usar:</h3>
                <ol className="text-sm text-blue-700 dark:text-slate-300 space-y-1 ml-4 list-decimal">
                    <li>Importe catálogos JSON anteriores (opcional)</li>
                    <li>Selecione o modelo da sua câmera</li>
                    <li>Adicione os arquivos de vídeo</li>
                    <li>Edite em lote ou individualmente</li>
                    <li>Gere o catálogo JSON final</li>
                </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-500" />
                        Modelo da Câmera <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={cameraModel}
                        onChange={(e) => setCameraModel(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">Selecione o modelo</option>
                        {CAMERA_MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    {!cameraModel && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                            ⚠️ Necessário para extração automática de metadados
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
