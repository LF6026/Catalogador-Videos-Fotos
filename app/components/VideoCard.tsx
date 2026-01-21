import React from 'react';
import { VideoFile } from '../types';
import { Film, CheckCircle2, Clock, Tag } from 'lucide-react';

interface VideoCardProps {
    video: VideoFile;
    isSelected?: boolean;
    onSelect?: () => void;
    onClick?: () => void;
}

export default function VideoCard({ video, isSelected, onSelect, onClick }: VideoCardProps) {
    const { metadata } = video;

    return (
        <div
            className={`
        group relative aspect-video bg-slate-900 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer
        ${isSelected
                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'border-slate-800 hover:border-slate-600 hover:shadow-md'
                }
      `}
            onClick={onClick}
        >
            {/* Thumbnail Layer */}
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                {metadata.thumbnail ? (
                    <img src={metadata.thumbnail} alt={video.filename} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <Film className="w-8 h-8 text-slate-700 group-hover:text-slate-500 transition-colors" />
                )}
            </div>

            {/* Overlay Gradient (Always visible but stronger on hover) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Selection Checkbox (Top Left) */}
            <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
            >
                <div className={`
          w-5 h-5 rounded-full flex items-center justify-center transition-all
          ${isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-black/40 text-transparent border border-white/30 hover:border-white/80 hover:bg-black/60'
                    }
        `}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* Badge (Top Right) - Duration */}
            {metadata.recordingTime && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-slate-300">
                    {metadata.recordingTime}
                </div>
            )}

            {/* Content (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-sm font-medium text-white truncate mb-0.5 w-[90%] leading-tight">
                    {metadata.title || <span className="text-slate-400 italic font-normal">{video.filename}</span>}
                </h3>

                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {metadata.date}
                    </span>
                    {metadata.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {metadata.tags.length}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
