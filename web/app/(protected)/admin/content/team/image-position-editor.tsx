"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/shared/ui/buttons/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/shared/ui/misc/dialog";
import { Move, RotateCcw, Check, X } from "lucide-react";
import Image from "next/image";

interface ImagePositionEditorProps {
    imageUrl: string;
    currentPosition: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (position: string) => void;
}

export function ImagePositionEditor({
    imageUrl,
    currentPosition,
    isOpen,
    onClose,
    onSave,
}: ImagePositionEditorProps) {
    // Parsear posición inicial
    const parsePosition = (pos: string): { x: number; y: number } => {
        if (!pos || pos === 'center') return { x: 50, y: 50 };
        
        // Si ya es formato "X% Y%"
        const match = pos.match(/(\d+(?:\.\d+)?)\s*%?\s+(\d+(?:\.\d+)?)\s*%?/);
        if (match) {
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
        }
        
        // Valores predefinidos legacy
        const presets: Record<string, { x: number; y: number }> = {
            'center': { x: 50, y: 50 },
            'top': { x: 50, y: 20 },
            'bottom': { x: 50, y: 80 },
            'left': { x: 20, y: 50 },
            'right': { x: 80, y: 50 },
            'top-left': { x: 20, y: 20 },
            'top-right': { x: 80, y: 20 },
            'bottom-left': { x: 20, y: 80 },
            'bottom-right': { x: 80, y: 80 },
        };
        
        return presets[pos] || { x: 50, y: 50 };
    };

    const initialPos = parsePosition(currentPosition);
    const [position, setPosition] = useState(initialPos);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPosition(parsePosition(currentPosition));
        }
    }, [isOpen, currentPosition]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;

        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;

        setPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        });
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleReset = () => {
        setPosition({ x: 50, y: 50 });
    };

    const handleSave = () => {
        const positionString = `${position.x.toFixed(1)}% ${position.y.toFixed(1)}%`;
        onSave(positionString);
        onClose();
    };

    const presetPositions = [
        { label: "↖", x: 20, y: 20 },
        { label: "↑", x: 50, y: 20 },
        { label: "↗", x: 80, y: 20 },
        { label: "←", x: 20, y: 50 },
        { label: "●", x: 50, y: 50 },
        { label: "→", x: 80, y: 50 },
        { label: "↙", x: 20, y: 80 },
        { label: "↓", x: 50, y: 80 },
        { label: "↘", x: 80, y: 80 },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Move className="h-5 w-5 text-orange-500" />
                        Ajustar Posición de Foto
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Instrucciones */}
                    <p className="text-sm text-gray-500">
                        Arrastra sobre la imagen o usa los controles para ajustar qué parte se muestra en el recorte circular.
                    </p>

                    {/* Editor principal */}
                    <div className="flex gap-4">
                        {/* Área de edición */}
                        <div 
                            ref={containerRef}
                            className="relative flex-1 aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-crosshair select-none border-2 border-gray-200"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Imagen completa */}
                            <Image
                                src={imageUrl}
                                alt="Editar posición"
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover pointer-events-none"
                                style={{ 
                                    objectPosition: `${position.x}% ${position.y}%`,
                                }}
                            />
                            
                            {/* Overlay con marco circular */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Oscurecer áreas fuera del círculo */}
                                <div className="absolute inset-0 bg-black/50" style={{
                                    maskImage: 'radial-gradient(circle at center, transparent 35%, black 35%)',
                                    WebkitMaskImage: 'radial-gradient(circle at center, transparent 35%, black 35%)',
                                }} />
                                
                                {/* Círculo de preview */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full border-4 border-white shadow-lg" />
                            </div>

                            {/* Punto de posición */}
                            <div 
                                className="absolute w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                                style={{ 
                                    left: `${position.x}%`, 
                                    top: `${position.y}%`,
                                }}
                            />

                            {/* Líneas guía */}
                            <div 
                                className="absolute h-full w-px bg-orange-400/50 pointer-events-none"
                                style={{ left: `${position.x}%` }}
                            />
                            <div 
                                className="absolute w-full h-px bg-orange-400/50 pointer-events-none"
                                style={{ top: `${position.y}%` }}
                            />
                        </div>

                        {/* Controles laterales */}
                        <div className="flex flex-col gap-3 w-32">
                            {/* Grid de presets */}
                            <div className="grid grid-cols-3 gap-1">
                                {presetPositions.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setPosition({ x: preset.x, y: preset.y })}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                            Math.abs(position.x - preset.x) < 5 && Math.abs(position.y - preset.y) < 5
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sliders */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Horizontal (X)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={position.x}
                                        onChange={(e) => setPosition(p => ({ ...p, x: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <span className="text-xs text-gray-400">{position.x.toFixed(0)}%</span>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Vertical (Y)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={position.y}
                                        onChange={(e) => setPosition(p => ({ ...p, y: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <span className="text-xs text-gray-400">{position.y.toFixed(0)}%</span>
                                </div>
                            </div>

                            {/* Botón reset */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                className="w-full mt-auto"
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Centrar
                            </Button>
                        </div>
                    </div>

                    {/* Preview circular */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-inner flex-shrink-0">
                            <Image
                                src={imageUrl}
                                alt="Preview circular"
                                fill
                                sizes="80px"
                                className="object-cover"
                                style={{ objectPosition: `${position.x}% ${position.y}%` }}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Vista previa</p>
                            <p className="text-xs text-gray-500">Así se verá en la página del equipo</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                        <Check className="h-4 w-4 mr-1" />
                        Guardar Posición
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
