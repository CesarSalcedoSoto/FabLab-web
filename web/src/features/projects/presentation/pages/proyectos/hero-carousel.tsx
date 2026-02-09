"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { heroImages } from "./data";

export function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % heroImages.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative w-full h-[50vh] min-h-[400px] bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-4xl mx-auto px-8">
                    <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                        <Image
                            src={heroImages[currentIndex]}
                            alt="Proyecto destacado"
                            fill
                            sizes="(max-width: 1024px) 100vw, 896px"
                            quality={80}
                            className="object-cover transition-opacity duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Indicators */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                        {heroImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? "w-8 bg-orange-500"
                                        : "w-2 bg-white/50 hover:bg-white/70"
                                    }`}
                                aria-label={`Ir a imagen ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute top-8 left-0 right-0 text-center z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                    Nuestros{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                        Proyectos
                    </span>
                </h1>
                <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto px-4">
                    Explora los proyectos desarrollados por nuestra comunidad de makers e innovadores
                </p>
            </div>
        </section>
    );
}
