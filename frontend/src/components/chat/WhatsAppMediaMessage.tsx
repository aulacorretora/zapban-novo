import React, { useState } from 'react';
import { Download, Play, File, Pause, X } from 'lucide-react';
import { Button } from '../ui/button';

interface MediaMessageProps {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export function WhatsAppMediaMessage({ type, url, fileName, fileSize, mimeType }: MediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleDownload = () => {
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const togglePlay = (audioEl: HTMLAudioElement) => {
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  switch (type) {
    case 'image':
      return (
        <div className="relative">
          <div 
            className={`relative rounded-lg overflow-hidden cursor-pointer ${isExpanded ? 'fixed top-0 left-0 w-full h-full z-50 bg-black/80 flex items-center justify-center p-4' : 'max-w-[200px]'}`}
            onClick={toggleExpand}
          >
            <img 
              src={url} 
              alt="Image"
              className={`rounded-lg ${isExpanded ? 'max-h-[90vh] max-w-[90vw] object-contain' : 'max-w-[200px]'}`}
            />
            {isExpanded && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-4 right-4 rounded-full bg-black/50 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar
          </Button>
        </div>
      );
    
    case 'video':
      return (
        <div className="relative">
          <div className="rounded-lg overflow-hidden max-w-[240px]">
            <video 
              src={url} 
              controls 
              className="max-w-full rounded-lg"
              poster={`${url}#t=0.1`}
            />
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar
          </Button>
        </div>
      );
    
    case 'audio':
      return (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={(e) => {
                const audioEl = e.currentTarget.parentElement?.querySelector('audio');
                if (audioEl) togglePlay(audioEl);
              }}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <audio 
              src={url} 
              className="hidden"
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex-1">
              <div className="h-1 bg-muted-foreground/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-0" id="progress"></div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">00:00</span>
          </div>
          <Button size="sm" variant="outline" className="mt-2 self-start" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar
          </Button>
        </div>
      );
    
    case 'document':
      return (
        <div className="flex flex-col">
          <div className="flex items-center space-x-3 bg-muted/50 rounded-lg p-3">
            <div className="bg-primary/10 text-primary p-2 rounded">
              <File className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fileName || 'Document'}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)} • {mimeType}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="mt-2 self-start" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar
          </Button>
        </div>
      );
    
    default:
      return null;
  }
}
