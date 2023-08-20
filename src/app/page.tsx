'use client'

import {Canvas} from '@react-three/fiber'
import React, {Suspense, useState} from "react";
import { OrbitControls} from '@react-three/drei'
import {useControls} from "leva";
import {AttractorParticles} from "@/components/TestAttractor";



const number = Math.floor(Math.random() * 7)


export default function Home() {

    const [Attractor, setAttractor] = useState(number.toString());
    const l = ["Lorenz", "LorenzMod2", "Thomas", "Dequan", "Dradas", "Arneodo", "Aizawa"]

    useControls(  "Change The Attractor Type Here!" ,{
        attractor: {
            value: l[number],
            options: l,
            onChange: (value) => {
                setAttractor(l.indexOf(value).toString())
            }
        }
    })

    const camera_pos_z = (Attractor === "0" || Attractor === "3")? 50 : 30



    return (
    <main className="min-h-screen h-screen bg-primary_background">
        <h2 className="text-left m-4">Refresh or use the drop down to change the attractor!</h2>
        <h2 className="text-left m-4">Use your mouse to zoom & interact!</h2>
      <Suspense fallback={"loading"}>
        <Canvas
            camera={ {
              fov: 45,
              position: [ 0, 0, camera_pos_z], // use the third index to bring the camera closer.
              zoom: 1
            }}>
          <AttractorParticles attr={Attractor} />
          <OrbitControls />
        </Canvas>
      </Suspense>
    </main>
  )
}
