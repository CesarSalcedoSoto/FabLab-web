import Image from "next/image";
import { cn } from "@/shared/utils";
import { ReactNode } from "react";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
}

const roundedClasses = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

export function ResponsiveImage({
  src,
  alt,
  className,
  width = 800,
  height = 600,
  priority = false,
  placeholder = true,
  rounded = "lg",
  shadow = "md",
}: ResponsiveImageProps) {
  return (
    <div className={cn("relative overflow-hidden", roundedClasses[rounded], shadowClasses[shadow])}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={80}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={cn(
          "w-full h-auto object-cover transition-transform duration-300 hover:scale-105",
          className
        )}
        placeholder={placeholder ? "blur" : "empty"}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
      {placeholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  );
}

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  className?: string;
  text?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

export function PlaceholderImage({
  width = 400,
  height = 300,
  className,
  text = "Imagen",
  rounded = "lg",
}: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300",
        roundedClasses[rounded],
        className
      )}
    >
      <div className="text-center">
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-sm text-gray-500 font-medium">{text}</p>
        <p className="text-xs text-gray-400 mt-1">
          {width} × {height}
        </p>
      </div>
    </div>
  );
}

interface ImageContainerProps {
  children: ReactNode;
  className?: string;
  overlay?: boolean;
  overlayContent?: ReactNode;
}

export function ImageContainer({
  children,
  className,
  overlay = false,
  overlayContent,
}: ImageContainerProps) {
  return (
    <div className={cn("relative group", className)}>
      {children}
      {overlay && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
