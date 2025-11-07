'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Renderer, Geometry, Program, Mesh } from 'ogl';

interface PrismaticBurstProps {
  intensity?: number; // brillo global
  speed?: number; // velocidad global
  distort?: number; // cantidad de distorsión
  rayCount?: number; // cantidad de rayos (0 para espectral continuo)
  animationType?: 'rotate' | 'rotate3d' | 'hover';
  hoverDampness?: number; // suavizado del hover (0-1)
  offset?: { x?: number | string; y?: number | string };
  // Extras para uso como fondo
  className?: string;
  fullScreen?: boolean;
  zIndex?: number;
  opacity?: number;
  mixBlendMode?: CSSProperties['mixBlendMode'] | 'none';
}

export default function PrismaticBurst({
  intensity = 2,
  speed = 0.5,
  distort = 0.1,
  rayCount = 0,
  animationType = 'rotate3d',
  hoverDampness = 0,
  offset = { x: 0, y: 0 },
  className,
  fullScreen = true,
  zIndex = 0,
  opacity = 1,
  mixBlendMode = 'none',
}: PrismaticBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Inicialización defensiva del renderer
    let renderer: Renderer | null = null;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(2, window.devicePixelRatio), alpha: true });
    } catch (err) {
      console.warn('PrismaticBurst: Failed to initialize WebGL Renderer', err);
      return;
    }
    if (!renderer || !renderer.gl) {
      console.warn('PrismaticBurst: WebGL context not available');
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      if (fullScreen) {
        renderer!.setSize(window.innerWidth, window.innerHeight);
      } else {
        const parent = canvas.parentElement;
        const rect = parent ? parent.getBoundingClientRect() : ({ width: window.innerWidth, height: window.innerHeight } as DOMRect);
        renderer!.setSize(rect.width, rect.height);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Triángulo de pantalla completa
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    });

    const vertex = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_intensity;
      uniform float u_speed;
      uniform float u_distort;
      uniform float u_rayCount;
      uniform vec2 u_mouse;
      uniform float u_animType; // 0.0 rotate, 1.0 rotate3d, 2.0 hover
      uniform vec2 u_offset;

      float PI = 3.1415926535897932384626433832795;

      float hash(vec2 p){
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
      }

      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
      }

      vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0*hsl.z - 1.0));
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (uv - 0.5);
        p.x *= u_resolution.x / u_resolution.y;
        p += vec2(u_offset.x / u_resolution.x, -u_offset.y / u_resolution.y);

        // Animación base: rotación y leve movimiento 3D
        float t = u_time * u_speed;
        float rot = t * 0.25;
        mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
        vec2 pr = p;
        if (u_animType == 0.0) {
          pr = R * p;
        } else if (u_animType == 1.0) {
          float wobble = sin(t * 0.7 + p.y * 4.0) * 0.15;
          mat2 R2 = mat2(cos(rot + wobble), -sin(rot + wobble), sin(rot + wobble), cos(rot + wobble));
          pr = R2 * p;
        } else {
          // hover: atraer hacia el mouse
          vec2 m = (u_mouse - 0.5);
          m.x *= u_resolution.x / u_resolution.y;
          pr = mix(p, p + normalize(m - p) * 0.1, 1.0);
        }

        // Distorsión orgánica
        float n = noise(pr * 3.0 + t * 0.5);
        pr += u_distort * vec2(cos(n * 6.283), sin(n * 6.283)) * 0.05;

        // Cálculo angular y radial
        float ang = atan(pr.y, pr.x);
        float rad = length(pr);

        // Espectro giratorio
        float hue = fract(ang / (2.0*PI) + t * 0.05);
        float sat = 0.9;
        float light = 0.6;
        vec3 base = hsl2rgb(vec3(hue, sat, light));

        // Rayos discretos si se define rayCount
        float rays = 1.0;
        if (u_rayCount > 0.5) {
          float k = floor(u_rayCount);
          rays = clamp(cos(ang * k) * 0.5 + 0.5, 0.0, 1.0);
        }

        // Atenuación radial para un vistazo tipo "burst"
        float falloff = exp(-rad * 2.5);

        vec3 col = base * rays * falloff * u_intensity;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: [gl.canvas.width, gl.canvas.height] },
        u_intensity: { value: intensity },
        u_speed: { value: speed },
        u_distort: { value: distort },
        u_rayCount: { value: rayCount },
        u_mouse: { value: [0.5, 0.5] },
        u_animType: { value: animationType === 'rotate' ? 0 : animationType === 'rotate3d' ? 1 : 2 },
        u_offset: { value: [typeof offset.x === 'number' ? offset.x : 0, typeof offset.y === 'number' ? offset.y : 0] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Animación basada en tiempo real para evitar pausas durante el scroll
    let raf: number;
    let lastTime = performance.now();
    const render = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000; // segundos
      lastTime = now;

      // Avanza el tiempo uniformemente independientemente de los FPS
      program.uniforms.u_time.value += dt;
      program.uniforms.u_resolution.value = [gl.canvas.width, gl.canvas.height];
      renderer!.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    };

    render();

    let targetMouse: [number, number] = [0.5, 0.5];
    let currentMouse: [number, number] = [0.5, 0.5];

    const onMouseMove = (e: MouseEvent) => {
      if (animationType !== 'hover') return;
      const rect = gl.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      targetMouse = [x, y];
      // suavizado
      currentMouse = [
        currentMouse[0] + (targetMouse[0] - currentMouse[0]) * Math.max(0, Math.min(1, hoverDampness)),
        currentMouse[1] + (targetMouse[1] - currentMouse[1]) * Math.max(0, Math.min(1, hoverDampness)),
      ];
      program.uniforms.u_mouse.value = currentMouse;
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [intensity, speed, distort, rayCount, animationType, hoverDampness, offset, fullScreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`${fullScreen ? 'fixed inset-0 w-screen h-screen' : 'absolute inset-0 w-full h-full'} ${className ?? ''}`}
      style={{ zIndex, opacity, pointerEvents: 'none', mixBlendMode: mixBlendMode === 'none' ? undefined : mixBlendMode }}
    />
  );
}