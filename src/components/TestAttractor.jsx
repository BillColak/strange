'use client'

import {OrbitControls, useFBO} from "@react-three/drei";
import {useFrame, extend, createPortal, useThree, Canvas} from "@react-three/fiber";
import {useEffect, useMemo, useRef} from "react";
import * as THREE from "three";
import testFragmentPoint from "./testFragmentPoint";


const getRandomData = (width, height) => {
    const len = width * height * 4;
    const data = new Float32Array(len);

    for (let i = 0; i < data.length; i++) {
        const stride = i * 4;
        data[stride] = (Math.random() - 0.5) * 4
        data[stride + 1] = (Math.random() - 0.5) * 4
        data[stride + 2] = (Math.random() - 0.5) * 4
        data[stride + 3] = Math.random() * 0.1
    }
    return data;
}

class SimulationMaterial extends THREE.ShaderMaterial {
    constructor(size) {
        const positionsTexture = new THREE.DataTexture(
            getRandomData(size, size),
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType
        );

        positionsTexture.needsUpdate = true;

        const simulationUniforms = {
            positions: { value: positionsTexture },
            attractor: { value: 0 }
        };

        super({
            uniforms: simulationUniforms,
            vertexShader: "#define GLSLIFY 1\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}",
            fragmentShader: "precision mediump float;\n#define GLSLIFY 1\n\nuniform float attractor;\nuniform sampler2D positions;\n\nvarying vec2 vUv;\n\nvec3 lorezAttractor(vec3 pos) {\n  // Lorenz Attractor parameters\n  float a = 10.0;\n  float b = 28.0;\n  float c = 2.6666666667;\n\n  // Timestep \n  float dt = 0.004;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n\tdx = dt * (a * (y - x));\n\tdy = dt * (x * (b - z) - y);\n\tdz = dt * (x * y - c * z);\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 lorezMod2Attractor(vec3 pos) {\n  // Lorenz Mod2 Attractor parameters\n  float a = 0.9;\n  float b = 5.0;\n  float c = 9.9;\n  float d = 1.0;\n\n  // Timestep \n  float dt = 0.0005;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n\tdx = (-a*x+ y*y - z*z + a *c) * dt;\n  dy = (x*(y-b*z)+d)  * dt;\n  dz = (-z + x*(b*y +z))  * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 thomasAttractor(vec3 pos) {\n  float b = 0.19;\n\n  // Timestep \n  float dt = 0.01;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n  dx = (-b*x + sin(y)) * dt;\n  dy = (-b*y + sin(z)) * dt;\n  dz = (-b*z + sin(x)) * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 dequanAttractor(vec3 pos) {\n  float a = 40.0;\n  float b = 1.833;\n  float c = 0.16;\n  float d = 0.65;\n  float e = 55.0;\n  float f = 20.0;\n\n   // Timestep \n  float dt = 0.0005;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n  dx = ( a*(y-x) + c*x*z) * dt;\n  dy = (e*x + f*y - x*z) * dt;\n  dz = (b*z + x*y - d*x*x) * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 dradasAttractor(vec3 pos) {\n  float a = 3.0;\n  float b = 2.7;\n  float c = 1.7;\n  float d = 2.0;\n  float e = 9.0;\n\n  // Timestep \n  float dt = 0.0020;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n  dx = (y- a*x +b*y*z) * dt;\n  dy = (c*y -x*z +z) * dt;\n  dz = (d*x*y - e*z) * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 arneodoAttractor(vec3 pos) {\n  float a = -5.5;\n  float b = 3.5;\n  float d = -1.0;\n\n  // Timestep \n  float dt = 0.0020;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n  dx = y * dt;\n  dy = z * dt;\n  dz = (-a*x -b*y -z + (d* (pow(x, 3.0)))) * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvec3 aizawaAttractor(vec3 pos) {\n  float a = 0.95;\n  float b = 0.7;\n  float c = 0.6;\n  float d = 3.5;\n  float e = 0.25;\n  float f = 0.1;\n\n  // Timestep \n  float dt = 0.003;\n\n  float x = pos.x;\n \tfloat y = pos.y;\n \tfloat z = pos.z;\n\n  float dx, dy, dz;\n\n  dx = ((z-b) * x - d*y) * dt;\n  dy = (d * x + (z-b) * y) * dt;\n  dz = (c + a*z - ((z*z*z) / 3.0) - (x*x) + f * z * (x*x*x)) * dt;\n\n  return vec3(dx, dy, dz);\n}\n\nvoid main() {\n  vec3 pos = texture2D(positions, vUv).rgb;\n  vec3 delta;\n\n  if(attractor == 0.0) {\n    delta = lorezAttractor(pos);\n  }\n\n  if(attractor == 1.0) {\n    delta = lorezMod2Attractor(pos);\n  }\n\n  if(attractor == 2.0) {\n    delta = thomasAttractor(pos);\n  }\n\n  if(attractor == 3.0) {\n    delta = dequanAttractor(pos);\n  }\n\n  if(attractor == 4.0) {\n    delta = dradasAttractor(pos);\n  }\n\n  if(attractor == 5.0) {\n    delta = arneodoAttractor(pos);\n  }\n\n  if(attractor == 6.0) {\n    delta = aizawaAttractor(pos);\n  }\n \n\n  pos.x += delta.x;\n  pos.y += delta.y;\n  pos.z += delta.z;\n\n  // pos.x += cos(pos.y) / 100.0;\n  // pos.y += tan(pos.x) / 100.0;\n\n  gl_FragColor = vec4(pos,1.0);\n}",
        });
    }
}

extend({ SimulationMaterial: SimulationMaterial });

export function AttractorParticles(props) {
    const size = 256*2;
    const points = useRef();
    const simulationMaterialRef = useRef();
    const { gl } = useThree();

    const { attr } = props;
    const Attractor = attr.toString();


    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);


    let writeTarget = useFBO(size, size, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        type: THREE.FloatType,
    });

    const particlesPosition = useMemo(() => {
        const length = size * size;
        const particles = new Float32Array(length * 3);
        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % size) / size;
            particles[i3 + 1] = i / size / size;
        }
        return particles;
    }, [size]);

    const uniforms = useMemo(() => ({
        positions: { value: null },
        pointSize: { value: 4 },
        uColor: { value: new THREE.Color('#7f8fff') },
    }), []);

    let renderTargetClone = writeTarget.clone();

    useEffect(() => {
        gl.setRenderTarget(writeTarget)
        gl.clear()
        gl.render(scene, camera)
        gl.setRenderTarget(renderTargetClone)
        gl.clear()
        gl.render(scene, camera)
        gl.setRenderTarget(null);
    }, [Attractor]);

    useFrame((state) => {
        const { gl } = state;
        let readTarget = writeTarget;
        writeTarget = renderTargetClone
        renderTargetClone = readTarget;

        simulationMaterialRef.current.uniforms.attractor.value = Attractor;
        simulationMaterialRef.current.uniforms.positions.value = renderTargetClone.texture;

        gl.setRenderTarget(writeTarget);
        gl.clear();

        gl.render(scene, camera);
        gl.setRenderTarget(null);

        points.current.material.uniforms.positions.value = writeTarget.texture;
    });

    return (
        <>
            {createPortal(
                <mesh>
                    <simulationMaterial ref={simulationMaterialRef} args={[size]} />
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        <bufferAttribute
                            attach="attributes-uv"
                            count={uvs.length / 2}
                            array={uvs}
                            itemSize={2}
                        />
                    </bufferGeometry>
                </mesh>,
                scene
            )}
            <points ref={points}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={"#define GLSLIFY 1\nuniform sampler2D positions;\nuniform float pointSize;\n\nvoid main() {\n  vec3 pos = texture2D(positions, position.xy).xyz;\n\n  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );\n  gl_PointSize = step(1.0 - (1.0/64.0), position.x) * pointSize;\n}"}
                    fragmentShader={testFragmentPoint}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
}

const Attractor = () => {
    return (
        <div className="h-screen">
            <Canvas camera={{ position: [1.5, 1.5, 25] }}>
                <ambientLight intensity={0.5} />
                <AttractorParticles />
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default Attractor;
