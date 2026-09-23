import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/useThemeStore';

/**
 * Procedural Glass Canvas Fallback (Tier 3)
 * Generates an animated, smooth dual-tone mesh gradient with organic film grain.
 */
const ProceduralMeshGradient: React.FC<{
  primary: string;
  secondary: string;
  surface: string;
}> = ({ primary, secondary, surface }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick += 0.003;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Base background tone
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, width, height);

      // Gradient Sphere 1 (Primary Accent)
      const x1 = width * 0.35 + Math.sin(tick) * (width * 0.15);
      const y1 = height * 0.4 + Math.cos(tick * 0.8) * (height * 0.15);
      const r1 = Math.max(width, height) * 0.65;

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      grad1.addColorStop(0, primary + '55'); // 33% hex opacity
      grad1.addColorStop(1, 'transparent');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Gradient Sphere 2 (Secondary Complement)
      const x2 = width * 0.75 + Math.cos(tick * 0.9) * (width * 0.15);
      const y2 = height * 0.65 + Math.sin(tick * 1.1) * (height * 0.15);
      const r2 = Math.max(width, height) * 0.55;

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      grad2.addColorStop(0, secondary + '44');
      grad2.addColorStop(1, 'transparent');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [primary, secondary, surface]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* SVG Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export const ResilientWallpaper: React.FC = () => {
  const { currentCharacter, userCustomWallpaper, wallpaperDim, wallpaperBlur } = useThemeStore();
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(userCustomWallpaper);
  const [tier, setTier] = useState<1 | 2 | 3>(userCustomWallpaper ? 1 : 3);

  useEffect(() => {
    let isCancelled = false;

    // ----------------------------------------------------
    // Tier 1: User Custom / Applied Online Wallpaper
    // ----------------------------------------------------
    if (userCustomWallpaper) {
      setResolvedSrc(userCustomWallpaper);
      setTier(1);
      return;
    }

    // ----------------------------------------------------
    // Tier 2: Bundled App Default Asset
    // ----------------------------------------------------
    if (currentCharacter.defaultWallpaper) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (!isCancelled) {
          setResolvedSrc(currentCharacter.defaultWallpaper);
          setTier(2);
        }
      };
      img.onerror = () => {
        if (!isCancelled) {
          setResolvedSrc(null);
          setTier(3);
        }
      };
      img.src = currentCharacter.defaultWallpaper;
      return () => {
        isCancelled = true;
      };
    }

    // ----------------------------------------------------
    // Tier 3: Procedural Mesh Gradient Fallback
    // ----------------------------------------------------
    setResolvedSrc(null);
    setTier(3);

    return () => {
      isCancelled = true;
    };
  }, [currentCharacter, userCustomWallpaper]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden select-none pointer-events-none">
      {tier === 3 || !resolvedSrc ? (
        <ProceduralMeshGradient
          primary={currentCharacter.palette.primary}
          secondary={currentCharacter.palette.secondary}
          surface={currentCharacter.palette.surface}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
          style={{
            backgroundImage: `url("${resolvedSrc}")`,
            filter: `blur(${wallpaperBlur}px) brightness(${1 - wallpaperDim / 100})`,
            transform: 'scale(1.05)', // Prevent edge blur bleeding
          }}
        />
      )}

      {/* Unified Darkness Veil to Guarantee Text Legibility */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          backgroundColor: currentCharacter.palette.surface,
          opacity: currentCharacter.palette.glassOpacity,
        }}
      />
    </div>
  );
};
