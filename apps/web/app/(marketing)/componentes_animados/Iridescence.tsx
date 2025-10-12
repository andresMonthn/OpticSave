'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Geometry, Program, Mesh } from 'ogl';

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  // Extras para uso como fondo en toda la app (compatibles con la integración existente)
  className?: string;
  fullScreen?: boolean;
  zIndex?: number;
  opacity?: number;
}

export default function Iridescence({
  color = [0.3, 0.2, 0.5],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = false,
  className,
  fullScreen = true,
  zIndex = 0,
  opacity = 1,
}: IridescenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crear renderer OGL usando el canvas del componente (con manejo defensivo)
    let renderer: Renderer | null = null;
    try {
      renderer = new Renderer({ canvas, dpr: Math.min(2, window.devicePixelRatio), alpha: true });
    } catch (err) {
      console.warn('Iridescence: Failed to initialize WebGL Renderer', err);
      return; // salir si la inicialización falla para evitar romper el flujo
    }

    if (!renderer || !renderer.gl) {
      console.warn('Iridescence: WebGL context not available');
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    // Ajustar tamaño dinámico
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

    // Geometría de triángulo de pantalla completa para evitar costuras
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
    });

    // Shaders (vertex y fragment) para el efecto de iridiscencia
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
      uniform vec3 u_color;
      uniform vec2 u_mouse;
      uniform float u_amp;

      // Pequeño ruido basado en hash para variación sutil
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
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time;

        // Ondas sutiles con ruido
        float n = noise(uv * 3.0 + t * 0.1);
        float wave = sin(uv.x * 6.283 + t * 0.5) * 0.5 + 0.5;

        // Influencia del ratón
        float m = u_amp * length(uv - u_mouse);

        // Matiz dinámico a lo largo del tiempo
        float hue = mod(t * 0.1 + n * 0.5 + wave * 0.25, 1.0);
        float sat = 0.8;
        float light = 0.6;
        vec3 iridescent = hsl2rgb(vec3(hue, sat, light));

        // Mezclar con color base
        vec3 base = u_color;
        vec3 col = mix(iridescent, base, 0.35);
        col += m * 0.2; // aporte de mouse

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: [gl.canvas.width, gl.canvas.height] },
        u_color: { value: color },
        u_mouse: { value: [0.5, 0.5] },
        u_amp: { value: amplitude },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    let raf: number;
    const render = () => {
      program.uniforms.u_time.value += 0.01 * speed;
      program.uniforms.u_resolution.value = [gl.canvas.width, gl.canvas.height];
      renderer!.render({ scene: mesh });
      raf = requestAnimationFrame(render);
    };

    render();

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseReact) return;
      const rect = gl.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      program.uniforms.u_mouse.value = [x, y];
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [speed, amplitude, mouseReact, color, fullScreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`${fullScreen ? 'fixed inset-0 w-screen h-screen' : 'absolute inset-0 w-full h-full'} ${className ?? ''}`}
      style={{ zIndex, opacity, pointerEvents: 'none' }}
    />
  );
}
