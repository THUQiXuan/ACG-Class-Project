import * as THREE from 'three'
import SceneConfig from '../types/sceneConfig'

export function init(config: SceneConfig) {

    const scene = new THREE.Scene()
    scene.background = config.skyColor
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true
    document.getElementById('game-holder')!.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(config.camera.pov, window.innerWidth / window.innerHeight, 0.3, 1000)
    camera.position.copy(config.camera.position)

    const light = new THREE.DirectionalLight(0xFFF4D6, 5)
    light.position.copy(config.lightPosition)
    light.castShadow = true
    const shadowCamera = light.shadow.camera
    shadowCamera.left = -100
    shadowCamera.right = 100
    shadowCamera.top = 100
    shadowCamera.bottom = -100
    light.shadow.radius = 2
    light.shadow.mapSize = new THREE.Vector2(4096, 4096)

    shadowCamera.updateProjectionMatrix()

    scene.add(light)
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity)

    const hemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x000000, config.shadowDeep ? config.shadowDeep : 0.7)
    scene.add(hemisphereLight)


    function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
        const canvas = renderer.domElement
        const width = window.innerWidth
        const height = window.innerHeight
        const canvasPixelWidth = canvas.width / window.devicePixelRatio
        const canvasPixelHeight = canvas.height / window.devicePixelRatio

        const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height
        if (needResize) {
            renderer.setSize(width, height, false)
        }
        return needResize
    }

    function animate() {
        renderer.render(scene, camera)
        requestAnimationFrame(animate)
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement
            camera.aspect = canvas.clientWidth / canvas.clientHeight
            camera.updateProjectionMatrix()
        }
    }
    animate()

    return { scene, renderer, camera, light }
}