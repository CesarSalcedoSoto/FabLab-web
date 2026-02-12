"use client";

import * as THREE from "three";
import { useState, useEffect, useRef } from "react";

interface LogoCubeProps {
  size: number;
  logoPath: string;
}

// Cubo placeholder / fallback
function CubeFallback({ size }: { size: number }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color="#f97316" metalness={0.1} roughness={0.3} />
    </mesh>
  );
}

// Componente que muestra el cubo con textura ya cargada
function TexturedCube({ size, texture }: { size: number; texture: THREE.Texture }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        map={texture}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

/**
 * Cubo 3D con logo en todas las caras
 * Carga la textura de forma segura sin usar Suspense
 */
export function LogoCube({ size, logoPath }: LogoCubeProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    
    const loader = new THREE.TextureLoader();
    loader.load(
      logoPath,
      (loadedTexture) => {
        if (mountedRef.current) {
          loadedTexture.minFilter = THREE.LinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          loadedTexture.needsUpdate = true;
          setTexture(loadedTexture);
          setLoading(false);
        }
      },
      undefined,
      (err) => {
        console.error("Error loading texture:", err);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
    };
  }, [logoPath]);

  // Mientras carga o no hay textura, mostrar cubo naranja
  if (loading || !texture) {
    return <CubeFallback size={size} />;
  }

  return <TexturedCube size={size} texture={texture} />;
}
