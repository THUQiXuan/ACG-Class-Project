import * as THREE from 'three'

import World from '../functions/world'
import Line from '../functions/line'
import { init } from '../functions/gameInit'
import { Howl } from 'howler'
//import { runTime } from '../functions/app'
import SceneConfig from '../types/sceneConfig'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { Vec3 } from 'cannon-es'
import  * as TWEEN from '@tweenjs/tween.js'
import { gradeMapping } from '../../gradeMapping'

import { createCrashEffect, noteEffect, flashEffect } from '../utils/specialEffect'
import { LoadMap } from '../utils/loadMap'
interface CustomWindow extends Window {
    worldTree: any;
    auth: any;
}

declare let window: CustomWindow;

export default class Game {

    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    light: THREE.DirectionalLight
    sound: Howl | null = null
    dieSound: Howl | null = null
    diamondMusic: Howl | null = null
    world: World
    line: Line
    mixers: THREE.AnimationMixer[] = []

    config: SceneConfig
    loader = new GLTFLoader()
    dracoLoader = new DRACOLoader();
    worldId: number

    tags: {status: 'run' | 'begin' | 'die' | 'win' | 'hold' | 'winning', fps: number} = {status: 'hold', fps: 0}
    clock = new THREE.Clock()
    sumSowTime = 0
    playTime = 0
    effectiveTime = 0
    collected = 0
    totalDiamonds = 0

    Group: TWEEN.Group;
    updateList: (any | null)[] = []
    diamondCollections: (THREE.Mesh)[] = []
    EndingMeshes: (THREE.Mesh)[] = []
    flag = 0
    Models: THREE.Group[] = []
    effectModels: THREE.Group[] = []
    lineConfig1: number = 0 // 3 states, [0,1,2]: none, headphone, hat;
    lineConfig2: number = 0 // [0,1,2]: none, turn flash, turn note

    constructor(config: SceneConfig, linePosition = new THREE.Vector3(0, 0.5, 0), worldId: number) {
        this.Group = new TWEEN.Group();
        this.worldId = worldId;
        this.config = config
        const { scene, renderer, camera, light } = init(config)
        this.scene = scene
        this.renderer = renderer
        this.camera = camera
        this.light = light
        this.line = new Line(this.scene, this.camera, this.light, linePosition, config)
        this.camera.lookAt(this.line.line!.position.x - 2, this.line.line!.position.y + 4, this.line.line!.position.z + 2)
        this.camera.updateProjectionMatrix()
        this.world = new World(this)
        this.dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
        this.loader.setDRACOLoader(this.dracoLoader);
        this.scene.onAfterRender = this.run.bind(this)
    }
    dispose() {
        this.sound?.unload()
        this.dieSound?.unload()
        this.diamondMusic?.unload()
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material instanceof THREE.Material) {
                    object.material.dispose();
                } else if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                }
            }
        });
        this.renderer.dispose();
        this.scene.remove(this.camera);
        this.scene.remove(this.light);
        this.world.dispose()
        this.line.dispose()
    }
    public updateConfig() {
        for (let i = 0; i < this.Models.length; i++)  {
            this.Models[i].visible = (this.lineConfig1 == this.Models[i].userData.id)
        }
        for(let i = 0; i < this.effectModels.length; i++) {
            if(this.lineConfig2 == 2 && this.effectModels[i].userData.id == 2) {
                const children = this.effectModels[i].children
                const index = Math.floor(Math.random() * children.length)
                noteEffect(children[index] as THREE.Mesh, this)
            }
        }
        if(this.lineConfig2 == 1) {
            flashEffect(this)
         }
    }
    async loadMap(anime_num: number) {
        await LoadMap(this, anime_num)
    }
    run() {
        const spt = this.clock.getDelta() 
        this.sumSowTime += spt
        for (let i = 0; i < this.updateList.length; i++)
            this.updateList[i]?.update(spt)
        for (let i = 0; i < this.diamondCollections.length; i++) {
            if (Math.abs(this.diamondCollections[i].position.x - this.line.line!.position.x) < 1 && Math.abs(this.diamondCollections[i].position.z - this.line.line!.position.z) < 1) {
                this.diamondMusic?.play()
                this.scene.remove(this.diamondCollections[i])
                this.diamondCollections.splice(i, 1)
                this.collected++
            }
        }
        this.tags.fps = Math.floor(1 / spt * 100) / 100
        const swh = this.sound?.seek()
        this.Group.update()
        this.mixers.forEach((mixer) => {mixer.update(spt)})
        // audio - frame alignment check
        let passShow = false

        if (this.tags.status == 'winning') {
            const x = this.world.line!.velocity.x
            const z = this.world.line!.velocity.z
            if (-x > 10 || z > 10) {
                this.world.line!.velocity.set(x * 0.8, 0, z * 0.8)
            }
        }
        if(swh && (this.tags.status == 'run' || this.tags.status == 'winning')) {
            this.playTime += spt
            if(Math.floor((swh - this.effectiveTime) * 1000) > 50) {
                this.sound?.seek(this.playTime)
                this.effectiveTime = swh
            }
            if(Math.floor((swh - this.effectiveTime) * 1000) < -50) {
                passShow = true
            } else {
                this.effectiveTime += spt
            }
        }
        if(this.tags.status !== 'die' && !passShow) {
            this.world.main.fixedStep()
        }
    }

    start() {
        if(this.sound) this.sound.play()
        this.tags.status = 'run'
        this.world.start()
    }
    win() {
        this.tags.status = 'winning'
        const direction = this.world.lineStatus.direction;    
        const moveDistance = 3
        this.line.camera_shake_last_time = 500
        this.line.noise_time = 0
        this.line.free_camera = false
        for (let i = 0; i < this.EndingMeshes.length; i++) {
            const groupItem = this.EndingMeshes[i];
            if (direction === 'z') {
                this.Group.add(
                new TWEEN.Tween(groupItem.position)
                    .to({ x: groupItem.position.x + (groupItem.name.endsWith('2') ? moveDistance : -moveDistance) }, 1000)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start());
            } else {
                this.Group.add(
                new TWEEN.Tween(groupItem.position)
                    .to({ z: groupItem.position.z + (groupItem.name.endsWith('2') ? -moveDistance : moveDistance) }, 1000)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start());
            }
        }
        setTimeout(() => {
            this.tags.status = 'win'
            this.world.stop()
            this.scene.onAfterRender = () => {}
            this.handleGameover()
        }, 5000);
    }
    die(normal: Vec3, create_crash: boolean) {
        this.tags.status = 'die'
        this.world.stop()
        this.dieSound?.play();
        this.sound?.stop()
        console.log(document)
        if (create_crash)
            createCrashEffect(normal, this)
        setTimeout(() => {
            this.scene.onAfterRender = () => {}
            this.handleGameover()
        }, 2000);

    }
    click() { 
        this.world.turn();
        if (this.lineConfig2 == 2) {
            const children = this.effectModels[0].children
            const index = Math.floor(Math.random() * children.length)
            noteEffect(children[index] as THREE.Mesh, this)
        }
        if(this.lineConfig2 == 1) {
            flashEffect(this)
        }
    }
    handleGameover() {
        const gameoverContainer = document.getElementById('gameover-container')!;
        const gameoverGrade = document.getElementById('gameover-grade')!;
        if (this.tags.status === 'win') {
            const grade = gradeMapping[this.totalDiamonds - this.collected];
            gameoverGrade.innerText = `${grade} (${this.collected}/${this.totalDiamonds} diamonds collected)`;
            const currentNode = window.worldTree.tree[this.worldId];
            window.worldTree.currentPlayer.status[this.worldId] = grade;
            if(window.worldTree.currentPlayer.status[this.worldId] === 'unlocked')
                window.worldTree.currentPlayer.status[this.worldId] = grade;
            for (let i = 0; i < currentNode.children.length; i++) {
                const childNode = currentNode.children[i];
                if(window.worldTree.currentPlayer.status[childNode] === 'locked')
                    window.worldTree.currentPlayer.status[childNode] = 'unlocked';
            }
        }
        else {
            gameoverGrade.innerText = `You fail to pass the level!`;
        }
        const diamondContainer = document.getElementById('diamond-container')!;
        diamondContainer.innerHTML = '';    
        for(let i = 0; i < this.totalDiamonds; i++) {
            const diamond = document.createElement('div');
            diamond.classList.add('diamond');
            if (i < this.collected) {
                diamond.classList.add('collected');
            }
            diamondContainer.appendChild(diamond);
        }
        gameoverContainer.style.display = 'block';
        diamondContainer.style.display = 'flex';
        window.worldTree.renderTree();            
    }
    removeFromScene(name: string) {
        const object = this.scene.getObjectByName(name)
        if(object) { this.scene.remove(object) }
    }
    
    public addObject(object: any, type?: string, groupPosition?: THREE.Vector3) {
        const worldItemId = this.world.createObject(object, type!, groupPosition)
    }

    public addMusic(path: string, diePath: string, diamondPath: string, volume = 0.5) {
        this.sound = new Howl({ src: path, html5: true, volume: volume * 0.4 })
        this.dieSound = new Howl({ src: diePath, html5: true, volume: volume })
        this.diamondMusic = new Howl({ src: diamondPath, html5: true, volume: volume })
    }
    
}

export{ Game };

