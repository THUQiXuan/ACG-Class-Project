import * as THREE from 'three'
import SceneConfig from '../types/sceneConfig';
import { createNoise2D } from 'simplex-noise';
const simplex = createNoise2D();

export default class Line {
    private scene: THREE.Scene
    private camera: THREE.Camera
    private cameraPosition: THREE.Vector3 = new THREE.Vector3()
    private cameraNewPosition: {position: THREE.Vector3, speend: number} | null = null
    private lightSystem: { object: any, position: THREE.Vector3 }[] = []

    line: THREE.Mesh | null = null
    lineList: THREE.Mesh[] = []
    drop = false

    lineColor: THREE.MeshPhongMaterialParameters
    camera_target_offset: THREE.Vector3 = new THREE.Vector3(-2, 5, 2)
    camera_new_target_offset: {position: THREE.Vector3, speend: number} | null = null
    camera_shake_offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
    noise_time: number = 0
    camera_shake_last_time: number = 0
    free_camera: boolean = true

    
    constructor(scene: THREE.Scene,
                camera: THREE.Camera,
                light: THREE.DirectionalLight,
                position = new THREE.Vector3(0, 0.5, 0),
                config: SceneConfig) {
        this.scene = scene
        this.camera = camera
        this.lineColor = config.lineColor ? config.lineColor : {color: 0x007acc}
        this.cameraPosition = this.camera.position.clone().sub(position)
        this.camera_target_offset = config.target.clone()

        this.lightSystem.push({object: light, position: light.position.clone()})
        this.lightSystem.push({object: light.target, position: light.target.position.clone()})
        this.initHead(position)
        this.cameraNewPosition = null
    }
    public dispose() {
        this.line = null
        this.lineList = []
        // this.scene = null
        // this.camera = null
        this.lightSystem = []
    }
    public moveCamera(relative: THREE.Vector3, speend = 0.1) {
        this.cameraNewPosition = { position: relative, speend: speend }
    }
    
    public moveCameraTarget(relative: THREE.Vector3, speend = 0.1) {
        this.camera_new_target_offset = { position: relative, speend: speend }
    }

    public dropFinish() {
        if(this.line && this.drop) {
            this.initLineBody(this.line.position)
            this.drop = false
        }
    }
    

    public runLine(direction: 'x' | 'z', difference: number) {
        if (direction == 'x' && difference < 0)
            return
        if (direction == 'z' && difference > 0)
            return
        // substract camera shake offset from camera position
        this.camera.position.sub(this.camera_shake_offset)
        if(this.line) {
            for(let i = 0; i < this.lightSystem.length; i++) {
                this.lightSystem[i].object.position.copy(this.camera.position.clone().add(this.lightSystem[i].position))
                this.lightSystem[i].object.lookAt(this.line.position)
            }
            if (!this.free_camera) {
                if(this.cameraNewPosition !== null) {
                    this.camera.position.lerp(this.cameraNewPosition.position.clone(),this.cameraNewPosition.speend)
                }
                if (this.camera_new_target_offset) {
                    this.camera_target_offset.lerp(this.camera_new_target_offset.position, this.camera_new_target_offset.speend)
                    if (this.camera_target_offset.distanceTo(this.camera_new_target_offset.position) < 1) {
                        this.camera_target_offset = this.camera_new_target_offset.position
                        this.camera_new_target_offset = null
                    }
                }
                this.camera.lookAt(this.line.position.clone().add(this.camera_target_offset))
            }
            else if (this.cameraNewPosition == null) {
                this.camera.position.lerp(this.line.position.clone().add(this.cameraPosition), 0.03)
            } 
            else {
                this.camera.position.lerp(this.cameraNewPosition.position.clone().add(this.line.position),this.cameraNewPosition.speend)
                if (this.camera.position.distanceTo(this.cameraNewPosition.position.clone().add(this.line.position)) < 1) {
                    this.cameraPosition = this.cameraNewPosition.position.clone()
                    this.cameraNewPosition = null   
                }
                this.camera.lookAt(this.line.position.clone().add(this.camera_target_offset))
            }

            if (this.camera_shake_last_time > 0.1) {
                this.camera_shake_last_time -= 0.1
                this.noise_time += 0.1
                const theta = simplex(this.noise_time, 0) * Math.PI * 2;
                const phi = simplex(this.noise_time, 1) * Math.PI;
                this.camera_shake_offset.set(
                    Math.sin(phi) * Math.cos(theta) * 0.1,
                    Math.sin(phi) * Math.sin(theta) * 0.1,
                    Math.cos(phi) * 0.1
                );
                this.camera.position.add(this.camera_shake_offset)
            }
            else {
                this.camera_shake_offset.set(0, 0, 0)
            }
            const nowLine = (this.lineList.length > 0) ? this.lineList[this.lineList.length - 1] : null
            const maxLineCount = 10
            if(this.lineList.length > maxLineCount) {
                const line = this.lineList.shift()
                if(line) this.scene.remove(line)
            }
            if(!this.drop && nowLine && this.lineList.length > 0) {
                nowLine.position[direction] -= difference / 2
                nowLine.scale[direction] += Math.abs(difference)
            }
        }
    }
    public initLineBody(position: THREE.Vector3) {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 )
        const material = new THREE.MeshPhongMaterial({color: this.lineColor.color})
        const cube = new THREE.Mesh( geometry, material )
        cube.position.copy(position)
        cube.receiveShadow = true
        cube.castShadow = true
        this.scene.add(cube)
        this.lineList.push(cube)
    }

    private initHead(position: THREE.Vector3) {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 )
        const material = new THREE.MeshPhongMaterial({color: this.lineColor.color})
        this.line = new THREE.Mesh( geometry, material )
        this.line.position.copy(position)
        this.line.receiveShadow = true
        this.line.castShadow = true
        this.scene.add(this.line)
    }
}