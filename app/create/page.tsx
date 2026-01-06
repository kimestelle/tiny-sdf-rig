'use client'
import { useState, useEffect } from 'react'
import FlowerEditor from '../garden-components/FlowerEditor'
import JarScene from '../sprite-components/JarScene';

export default function Page() {
    const [editMode, setEditMode] = useState<'garden' | 'sprite'>('garden')
    return (
        <div className='w-full h-full relative flex flex-col'>
        <div className='absolute z-[10] w-full h-fit flex flex-col'>
            { editMode == 'garden' &&
                <><h1>Flower Editor</h1>
                <FlowerEditor/>
                </>
            }
        </div> 
        <JarScene/>           
        </div>
    )
}