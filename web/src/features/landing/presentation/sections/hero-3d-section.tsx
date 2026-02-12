"use client";

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useClickPrice from '@/shared/helpers/easter-eggs/click-price';
import { InacapLogo3D } from './inacap-logo-3d';
import DonutModel from './donut-3d';
import DotGridBackground from '@/shared/ui/backgrounds/dot-grid';
import { FabLabCube, AdaptiveText } from '@/shared/ui/three';

function Scene({ model }: { model: "donut" | "cube" | "inacap" }) {
    return (
        <Suspense fallback={null}>
            {
                model === "donut" ? <DonutModel /> :
                    model === "inacap" ? <InacapLogo3D /> :
                        <FabLabCube />
            }
            <AdaptiveText />
        </Suspense>
    );
}

function ScrollIndicator() {
    return (
        <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
        >
            <span className="text-gray-500 text-sm font-semibold tracking-wide">Descubre más</span>
            <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <ChevronDown className="w-6 h-6 text-gray-400" />
            </motion.div>
        </motion.div>
    );
}

export function Hero3DSection() {
    const [model, setModel] = useState<"donut" | "cube" | "inacap">("cube");
    const hook = useClickPrice({
        initialPrice: 5,
        resetPrice: true,
        onPrice: () => {
            if (model === "cube") setModel("inacap");
            else if (model === "inacap") setModel("donut");
            else setModel("cube");
        }
    });

    return (
        <section className="relative w-full h-[85vh] bg-white flex items-center justify-center isolate overflow-hidden">
            {/* 3D Canvas - fondo */}
            <div className="absolute inset-0 z-0">
                <Canvas 
                    className="w-full h-full"
                    onError={(error) => console.error('Canvas error:', error)}
                    gl={{ antialias: true, alpha: false }}
                    dpr={[1, 2]}
                >
                    <color attach="background" args={['#ffffff']} />
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[26, 8, 6]} intensity={1} />
                    <spotLight
                        position={[-4, 6, 4]}
                        angle={0.9}
                        penumbra={0.4}
                        intensity={1.1}
                    />
                    <Scene model={model} />
                </Canvas>
            </div>

            {/* Dot Grid - encima, captura mouse y click */}
            <div className="absolute inset-0 z-10" onClick={hook.handleClick}>
                <DotGridBackground
                    gap={28}
                    dotSize={1.4}
                    baseOpacity={0.18}
                    hoverOpacity={0.7}
                    hoverRadius={160}
                />
            </div>

            <ScrollIndicator />
        </section>
    );
}
