"use client";

import { getColorClass } from "@/lib/colorClass";
import { useState } from "react";

export function ColorPlatte({colors = []}: {colors?: string[]}) {
    const validColors = Array.isArray(colors) ? colors : [];
    const [selectedColor, setSelectedColor] = useState(validColors[0] || "");

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
    }

    if (validColors.length === 0) return null;

    return (
            <div className="flex gap-2">
                {
                    validColors.map((color) => (
                        <button key={color} 
                        className={`${getColorClass(color)} rounded-full w-6 h-6 transition-all duration-300 ${selectedColor === color ? 'border-4 border-gray-400 scale-110' : ''}`} 
                        onClick={() => handleColorChange(color)}></button>
                    ))
                }
            </div>
    )
}
