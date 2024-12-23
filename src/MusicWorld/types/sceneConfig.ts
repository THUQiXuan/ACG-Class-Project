import * as THREE from 'three'

// {
//             skyColor: new THREE.Color(worldConfig.skyColor), //'#ffffff'
//             lineColor: { color: worldConfig.color }, //0xf5504c
//             lineSpeed: 15.08,
//             shadowDeep: 0.3,
//             canvaName: 'three',
//             camera: {
//                 pov: worldConfig.cameraPov,
//                 position: new THREE.Vector3(worldConfig.cameraPos.x, worldConfig.cameraPos.y, worldConfig.cameraPos.z),
//             },
//             lightPosition: worldConfig.lightPos,
//             fogColor: new THREE.Color(worldConfig.fogColor),
//             fogDensity: worldConfig.fogDensity,
//             snowy: worldConfig.snowy,
//         }
interface SceneConfig {
    skyColor: THREE.Color
    lineColor: { color: number }
    lineSpeed: number
    shadowDeep: number
    canvaName: string
    camera: {
        pov: number
        position: THREE.Vector3
    }
    lightPosition: {
        x: number
        y: number
        z: number
    }
    fogColor: THREE.Color
    fogDensity: number
    snowy: boolean
    target: THREE.Vector3
}

export default SceneConfig;