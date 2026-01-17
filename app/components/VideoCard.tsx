import React from 'react';
import { Trash2 } from 'lucide-react';
import { VideoFile } from '../types';

interface VideoCardProps {
    video: VideoFile;
    isSelected: boolean;
    isCurrent: boolean;
    onSelect: () => void;
    onClick: () => void;
    onRemove: () => void;
}

export default function VideoCard({
    video,
    isSelected,
    isCurrent,
    onSelect,
    onClick,
    onRemove
}: VideoCardProps) {
    const fileSizeMB = (video.size / 1024 / 1024).toFixed(2);
    const hasAutoMetadata = !!(video.metadata.recordingTime || video.metadata.lens || video.metadata.clipNumber);
    const hasCustomFields = video.metadata.customFields && video.metadata.customFields.length > 0;

    return (
        <div
            onClick={onClick}
            className={`
        group relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden border
        ${isCurrent
                    ? 'ring-2 ring-blue-500 shadow-lg border-blue-500 bg-blue-50'
                    : isSelected
                        ? 'ring-2 ring-purple-500 shadow-md border-purple-500 bg-purple-50'
                        : 'bg-white hover:shadow-md border-slate-200 hover:border-blue-300'
                }
      `}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer border-gray-300"
                        />
                        <div className="truncate">
                            <h3 className="font-semibold text-slate-800 text-sm truncate" title={video.filename}>
                                {video.filename}
                            </h3>
                            <p className="text-xs text-slate-500">{fileSizeMB} MB</p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover vídeo"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    {video.metadata.title && (
                        <p className="text-sm text-slate-700 font-medium truncate bg-slate-100 px-2 py-1 rounded">
                            {video.metadata.title}
                        </p>
                    )}

                    {video.metadata.location && (
                        <p className="text-xs text-slate-500 truncate">
                            📍 {video.metadata.location}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                        {hasAutoMetadata && (
                            <span className="inline-block text-[10px] uppercase font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Auto
                            </span>
                        )}
                        {hasCustomFields && (
                            <span className="inline-block text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                +{video.metadata.customFields.length} Custom
                            </span>
                        )}
                        {video.metadata.tags.length > 0 && (
                            <span className="inline-block text-[10px] uppercase font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                {video.metadata.tags.length} Tags
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Visual indicator bar at bottom */}
            <div className={`h-1 w-full ${isCurrent ? 'bg-blue-500' : isSelected ? 'bg-purple-500' : 'bg-transparent'}`} />
        </div>
    );
}
