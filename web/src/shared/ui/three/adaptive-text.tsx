"use client";

import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

/**
 * Material shader que invierte colores según el fondo
 */
function useAdaptiveTextMaterial() {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSceneTexture: { value: null },
      },
      vertexShader: `
        varying vec2 vScreenPos;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 clipPos = projectionMatrix * mvPosition;
          vScreenPos = clipPos.xy / clipPos.w * 0.5 + 0.5;
          gl_Position = clipPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uSceneTexture;
        varying vec2 vScreenPos;
        
        void main() {
          vec4 sceneColor = texture2D(uSceneTexture, vScreenPos);
          float luminance = dot(sceneColor.rgb, vec3(0.299, 0.587, 0.114));
          // Si el fondo es oscuro (< 0.5), texto blanco, si no negro
          vec3 textColor = luminance < 0.5 ? vec3(1.0) : vec3(0.0);
          gl_FragColor = vec4(textColor, 1.0);
        }
      `,
      transparent: false,
    });
  }, []);
}

/**
 * Texto adaptativo que invierte color cuando el cubo pasa por encima
 */
export function AdaptiveText() {
  const textGroupRef = useRef<THREE.Group>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shaderReady, setShaderReady] = useState(false);
  const textMaterial = useAdaptiveTextMaterial();

  // Detectar móvil de forma estable
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setMounted(true);
    // Dar tiempo para que el canvas se inicialice
    setTimeout(() => setShaderReady(true), 100);
  }, []);

  useFrame((state) => {
    if (!textGroupRef.current || !shaderReady) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rootState = state as any;
      const gl = rootState.gl as THREE.WebGLRenderer;
      const scene = rootState.scene as THREE.Scene;
      const camera = rootState.camera as THREE.Camera;
      const size = rootState.size as { width: number; height: number };

      if (!gl || !scene || !camera || !size) return;

      // Crear render target si no existe o si cambió el tamaño
      if (
        !renderTargetRef.current ||
        renderTargetRef.current.width !== size.width ||
        renderTargetRef.current.height !== size.height
      ) {
        renderTargetRef.current?.dispose();
        renderTargetRef.current = new THREE.WebGLRenderTarget(
          size.width, 
          size.height, 
          {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
          }
        );
      }

      // Ocultar texto temporalmente
      textGroupRef.current.visible = false;

      // Renderizar escena (sin texto) al render target
      const previousTarget = gl.getRenderTarget();
      gl.setRenderTarget(renderTargetRef.current);
      gl.render(scene, camera);
      gl.setRenderTarget(previousTarget);

      // Mostrar texto de nuevo
      textGroupRef.current.visible = true;

      // Actualizar la textura en el material
      if (textMaterial.uniforms.uSceneTexture) {
        textMaterial.uniforms.uSceneTexture.value = renderTargetRef.current.texture;
      }
    } catch (error) {
      console.error("Error in AdaptiveText shader:", error);
    }
  });

  useEffect(() => {
    return () => {
      if (renderTargetRef.current) {
        renderTargetRef.current.dispose();
        renderTargetRef.current = null;
      }
    };
  }, []);

  // Tamaños responsivos
  const titleSize = isMobile ? 0.5 : 1.1;
  const subtitleSize = isMobile ? 0.07 : 0.14;
  const titleY = isMobile ? 0.15 : 0.3;
  const subtitleY = isMobile ? -0.18 : -0.4;

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <group ref={textGroupRef} position={[0, 0, 4]}>
        <Text
          position={[0, titleY, 0]}
          fontSize={titleSize}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
          fontWeight={800}
          material={shaderReady ? textMaterial : undefined}
          color={shaderReady ? undefined : "#1f1f1f"}
        >
          FABLAB
        </Text>
        <Text
          position={[0, subtitleY, 0]}
          fontSize={subtitleSize}
          anchorX="center"
          anchorY="middle"
          material={shaderReady ? textMaterial : undefined}
          color={shaderReady ? undefined : "#1f1f1f"}
          maxWidth={isMobile ? 2.5 : 10}
        >
          Laboratorio de Fabricación Digital INACAP
        </Text>
      </group>
    </Suspense>
  );
}
