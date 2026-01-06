"use client";

import React, { useRef, useEffect, useState } from "react";
import { Flower } from '../types'

const W = 512;
const H = 512

type FlowerCanvasProps = {
    isEditing: boolean;
    flower: Flower;
    onSave: (newBitmap: ImageBitmap) => void;
    onSelect: (selected: boolean) => void;
}

export default function FlowerCanvas({isEditing, flower, onSave, onSelect}: FlowerCanvasProps) { 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#9ac1ff");
  const [brushSize, setBrushSize] = useState(60);
  const [blur, setBlur] = useState(0);
  const [isErasing, setIsErasing] = useState(false);

  function toggleSelect() {
    onSelect(!isEditing)
  }

  const getMousePos = (e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e && "clientY" in e) {
      clientX = (e as MouseEvent | React.MouseEvent).clientX;
      clientY = (e as MouseEvent | React.MouseEvent).clientY;
    } else {
      clientX = 0;
      clientY = 0;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  async function stopDrawing() {
    setIsDrawing(false);
    const canvas = canvasRef.current
    if (onSave && canvas) {
        const bitmap = await createImageBitmap(canvas, 0, 0, 512, 512)
      onSave(bitmap);
    }
  };

  const draw = (e: React.MouseEvent | MouseEvent | TouchEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getMousePos(e);

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)'; // color doesn't matter in erase mode
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
    }

    if (isErasing) {
        ctx.shadowBlur = 0;
    } else {
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const toggleEraser = () => {
    setIsErasing(!isErasing);
  }

  const changeBrushSize = (size: number) => {
    setBrushSize(size);
  }

    const changeBlur = (b: number) => {
        setBlur(b);
    }

  useEffect(() => {
    console.log(color);
    }, [color]);

  return (
    <div className={`h-full flex flex-col justify-center items-center p-[1svh] pb-[0.5svh]
        ${isEditing ? 'absolute bg-white top-[20svh]' : 'relative'}
    `}
    style={{placeSelf: (isEditing ? 'center' : '')}}
    >
        <button className='absolute top-0 left-0'
            onClick={toggleSelect}
        >
            { isEditing ? 'close' : 'edit'}
        </button>
        {isEditing ? 
        (<>
        <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className='h-full aspect-square cursor-crosshair border'
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => { setIsDrawing(true); draw(e); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
        onTouchEnd={stopDrawing}
        />
            <div className='h-[5svh] mt-[1svh] flex flex-row justify-center items-center gap-[1svh]'>
                <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className='custom-color cursor-pointer'
                />
                <button 
                    onClick={toggleEraser} 
                    className={`h-[3.5svh] aspect-square ${isErasing ? 'bg-checkerboard-active' : 'bg-checkerboard'}`}
                >
                </button>
                <div className='flex flex-col justify-center'>
                        <input 
                            type="range" 
                            min={4} 
                            max={100} 
                            value={brushSize} 
                            onChange={(e) => changeBrushSize(parseInt(e.target.value))}
                            className='custom-range size-range cursor-pointer my-[1svh]'
                        />
                </div>
            </div>
        </>
        ) : (
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className='h-full aspect-square cursor-pointer border'
            />
        )
        }
    </div>
  );
};
