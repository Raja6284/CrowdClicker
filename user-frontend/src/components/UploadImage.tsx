"use client"
import { useState } from "react"

export function UploadImage(){

    const [image,setImage] = useState("")
    
    return(
        <div className="h-50 w-50 border rounded text-2xl cursor-pointer">
            <div className="h-full flex justify-center">
               <div className="h-full flex justify-center flex-col">
                +
                <input type="file" style="opacity: 0.0; position: absolute; top: 0; left: 0; bottom: 0; right: 0; width: 100%; height:100%;" />
               </div>
            </div>

        </div>
    )
}