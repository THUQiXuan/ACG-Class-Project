// FILE: World.ts
import * as THREE from 'three';
import { GameLoop } from "./system/GameLoop";
import { Man } from "./object/src/Man";
import { Ground } from "./object/src/Ground";
import { Maze } from './object/src/Maze';
import { Init } from './utils/Init';
import { gradeMapping } from '../gradeMapping';

interface CustomWindow extends Window {
    worldTree: any;
    auth: any;
}

declare let window: CustomWindow;

class MazeWorld {
    worldId: number;

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    loop: GameLoop;

    correctAnswers: number;
    pointLight: THREE.PointLight;
    listener: THREE.AudioListener;
    backgroundMusic: THREE.Audio;
    pickUpSound: THREE.Audio;

    man: Man;
    ground: Ground;
    maze: Maze;

    keyboard: { [key: string]: number } = {};
    textureDict: { [key: string]: THREE.Texture } = {};
    gameoverListener: (e: Event) => void;
    questions: any[] = [];
    diamondModel: THREE.Object3D;
    updatableObjects: { tick: (delta: number) => void }[] = [];
    
    constructor() {

    }
    async init(worldId: number) {
        await Init(this, worldId);
        
    }
    start() {
        this.loop.start();
        this.scene.userData.camera = this.camera;
    }

    handleGameover(e: Event) {
        if (!(e instanceof CustomEvent)) return;
        document.removeEventListener("gameover", this.gameoverListener);
        document.removeEventListener("questionAnswered", (event: Event) => {
            if (!(event instanceof CustomEvent)) return;
            const { isCorrect } = event.detail;
            if (isCorrect) this.correctAnswers++;
        });
        window.removeEventListener("keydown", (event) => {
            this.keyboard[event.code] = 1;
        });
        window.removeEventListener("keyup", (event) => {
            this.keyboard[event.code] = 0;
        });
        this.loop.stop();
        const gameoverContainer = document.getElementById('gameover-container')!;
        const gameoverGrade = document.getElementById('gameover-grade')!;
        const totalQuestions = 4; 
        const grade = gradeMapping[totalQuestions - this.correctAnswers];
        gameoverGrade.innerText = `${grade} (${this.correctAnswers}/${totalQuestions} Diamonds Collected)`;
        gameoverContainer.style.display = 'block';
        const currentNode = window.worldTree.tree[this.worldId];
        window.worldTree.currentPlayer.status[this.worldId] = grade;
        for (let i = 0; i < currentNode.children.length; i++) {
            const childNode = currentNode.children[i];
            window.worldTree.currentPlayer.status[childNode] = 'unlocked';
        }
        window.worldTree.renderTree();
    }

    goBackToWorldTree() {
        this.backgroundMusic.stop();
        document.getElementById("game-holder")!.removeChild(this.renderer.domElement);
        document.getElementById('gameover-continue')!.removeEventListener('click', this.goBackToWorldTree);
        document.getElementById('gameover-container')!.style.display = 'none';
        document.getElementById('game-holder')!.style.display = 'none';
        document.getElementById('tree-container')!.style.display = 'block';
        location.reload();
    }    
    
}

export { MazeWorld };