'use client'
import { useRef, useState, useEffect } from 'react';
import FlowerCanvas from "./FlowerCanvas";
import { Flower } from "../types"

export default function FlowerEditor() {
    const [flowers, setFlowers] = useState<Flower[]>([]);
    const [activeCanvas, setActiveCanvas] = useState<number | null>(null)


    const handleSave = (bitmap: ImageBitmap, index: number) => {
        const flower = flowers[index];
        const newArray = flowers.filter((v, i) => (i != index));
        const newFlower: Flower = {
            texture: bitmap,
            message: flower.message,
            position: flower.position
        }
        newArray.push(newFlower)
        setFlowers(newArray);
    }

    function handleSelect(index: number, isSelected: boolean) {
        if (isSelected) {
            setActiveCanvas(index)
        } else {
            setActiveCanvas(null)
        }
    } 

    async function addFlower() {
        const newImage = new ImageData(512, 512)

        const bitmap = await createImageBitmap(newImage, 0, 0, 512, 512)

        const newFlower: Flower = {
            texture: bitmap,
            message: '',
            position: {angle: 0, distance: 0}
        }

        console.log(newFlower)
        if (!newFlower) {
            console.log('no flower')
        }
        setFlowers((prev) => [newFlower, ...prev])

        console.log(flowers)
    }

    return (
        <div className='w-full h-auto flex flex-col gap-2'>
            <button
                onClick={addFlower}
            >
                add flower
            </button>
            <div className='w-full h-24 flex flex-row flex-wrap flex-row gap-1'>
                {
                    flowers.map((flower, index) =>
                        <FlowerCanvas 
                            key={index}
                            isEditing={activeCanvas == index}
                            flower={flower}
                            onSave={(newBitmap: ImageBitmap) => handleSave(newBitmap, index)}
                            onSelect={(isSelected: boolean) => handleSelect(index, isSelected)}
                        />
                    )
                }
            </div>
        </div>
    )
}