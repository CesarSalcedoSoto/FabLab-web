"use client";

import { RotatingGroup } from "./rotating-group";
import { LogoCube } from "./logo-cube";
import { LOGOS } from "@/shared/constants/assets";
import { useState, useEffect } from "react";

interface FabLabCubeProps {
  desktopSize?: number;
  mobileSize?: number;
}

/**
 * Cubo 3D con el logo de FabLab que rota
 * Centrado con el texto FABLAB
 */
export function FabLabCube({
  desktopSize = 2.5,
  mobileSize = 1.2
}: FabLabCubeProps) {
  // Usar un valor estable para evitar re-renders durante hidratación
  const [cubeSize, setCubeSize] = useState(desktopSize);
  const [centerY, setCenterY] = useState(0.3);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setCubeSize(isMobile ? mobileSize : desktopSize);
    setCenterY(isMobile ? 0.15 : 0.3);
  }, [mobileSize, desktopSize]);

  return (
    <group position={[0, centerY, 0]}>
      <RotatingGroup>
        <LogoCube size={cubeSize} logoPath={LOGOS.FABLAB_MAIN} />
      </RotatingGroup>
    </group>
  );
}
