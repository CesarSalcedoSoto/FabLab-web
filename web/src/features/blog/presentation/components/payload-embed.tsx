"use client";

import { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, Plus, FileText, Settings } from 'lucide-react';
import { Button } from '@/shared/ui/buttons/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/cards/card';

// Obtener la URL base del servidor
const getServerUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SERVER_URL || '';
};

interface PayloadEmbedProps {
    /** Ruta del CMS a mostrar, por ejemplo: /cms/collections/posts */
    path?: string;
    /** Título a mostrar en el header */
    title?: string;
    /** Descripción */
    description?: string;
    /** Altura mínima del iframe */
    minHeight?: string;
}

export function PayloadEmbed({
    path = '/cms/collections/posts',
    title = 'Gestión de Posts',
    description = 'Usa el editor de Payload CMS para crear y editar contenido',
    minHeight = 'calc(100vh - 200px)'
}: PayloadEmbedProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [key, setKey] = useState(0);

    const serverUrl = getServerUrl();
    const iframeSrc = `${serverUrl}${path}`;

    const handleRefresh = () => {
        setIsLoading(true);
        setKey(prev => prev + 1);
    };

    const handleOpenExternal = () => {
        window.open(iframeSrc, '_blank');
    };

    const quickLinks = [
        { label: 'Nuevo Post', href: '/cms/collections/posts/create', icon: Plus },
        { label: 'Todos los Posts', href: '/cms/collections/posts', icon: FileText },
        { label: 'Categorías', href: '/cms/collections/categories', icon: Settings },
        { label: 'Media', href: '/cms/collections/media', icon: Settings },
    ];

    return (
        <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="h-4 w-4 mr-2" />
                                Salir
                            </>
                        ) : (
                            <>
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Pantalla completa
                            </>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir en nueva pestaña
                    </Button>
                </div>
            </div>

            {/* Quick Links */}
            {!isFullscreen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Card
                                key={link.href}
                                className="cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                                onClick={() => {
                                    setIsLoading(true);
                                    // Actualizar el iframe con la nueva ruta
                                    const iframe = document.getElementById('payload-iframe') as HTMLIFrameElement;
                                    if (iframe) {
                                        iframe.src = `${serverUrl}${link.href}`;
                                    }
                                }}
                            >
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-sm">{link.label}</span>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Iframe Container */}
            <Card className="overflow-hidden">
                <CardContent className="p-0 relative">
                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground">Cargando editor...</p>
                            </div>
                        </div>
                    )}

                    {/* Payload CMS iframe */}
                    <iframe
                        id="payload-iframe"
                        key={key}
                        src={iframeSrc}
                        className="w-full border-0"
                        style={{ minHeight, height: isFullscreen ? 'calc(100vh - 120px)' : minHeight }}
                        onLoad={() => setIsLoading(false)}
                        title="Payload CMS Editor"
                    />
                </CardContent>
            </Card>

            {/* Help text */}
            {!isFullscreen && (
                <p className="text-xs text-muted-foreground text-center">
                    El editor usa Payload CMS. Si tienes problemas,
                    <button
                        onClick={handleOpenExternal}
                        className="text-orange-600 hover:underline ml-1"
                    >
                        ábrelo en una nueva pestaña
                    </button>
                </p>
            )}
        </div>
    );
}
