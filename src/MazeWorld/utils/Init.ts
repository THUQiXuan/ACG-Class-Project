import * as THREE from 'three';
import { MazeWorld } from '../MazeWorld';
import { GameLoop } from "../system/GameLoop";
import { Man } from "../object/src/Man";
import { Ground } from "../object/src/Ground";
import { Maze } from '../object/src/Maze';
import { loadAssets } from './LoadAssets';

interface CustomWindow extends Window {
    worldTree: any;
    auth: any;
}

declare let window: CustomWindow;

export async function Init(mW: MazeWorld, worldId: number) {

    mW.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    await loadAssets(mW, worldId); 

    mW.man = new Man('Alice', null);
    mW.man.mesh.name = 'Alice';
    mW.maze = new Maze('maze', mW.textureDict['maze']);
    mW.ground = new Ground('ground', mW.textureDict['ground']);

    mW.scene = new THREE.Scene();

    mW.camera.position.set(mW.man.mesh.position.x, mW.man.mesh.position.y, 5);
    mW.camera.lookAt(mW.man.mesh.position);
    mW.man.mesh.add(mW.camera);

    mW.renderer = new THREE.WebGLRenderer({ antialias: true });
    mW.renderer.setSize(window.innerWidth, window.innerHeight);
    mW.renderer.shadowMap.enabled = true;
    mW.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById("game-holder")!.appendChild(mW.renderer.domElement);

    mW.loop = new GameLoop(mW.scene, mW.camera, mW.renderer);

    mW.pointLight= new THREE.PointLight(0xffffff, 1);
    mW.pointLight.position.set(mW.man.mesh.position.x, mW.man.mesh.position.y, 1.3);
    mW.pointLight.name = 'ballChasingPointLight';
    mW.pointLight.castShadow = true;

    mW.man.mesh.add(mW.pointLight);
    mW.scene.add(mW.man.mesh);
    mW.scene.add(mW.ground.mesh);

    window.addEventListener("keydown", (event) => {
        mW.keyboard[event.code] = 1;
    });
    window.addEventListener("keyup", (event) => {
        mW.keyboard[event.code] = 0;
    });
    document.getElementById("gameover-continue")!.addEventListener("click", () => {
        mW.goBackToWorldTree();
    });
    mW.gameoverListener = mW.handleGameover.bind(mW);

    mW.backgroundMusic.play();
    mW.man.pickUpSound = mW.pickUpSound;

    mW.worldId = worldId;
    mW.loop.updatableLists = [];
    mW.maze.walls.forEach((wall) => {
        mW.scene.remove(wall);
    });

    mW.maze.init(worldId, mW.scene, mW.diamondModel);
    mW.maze.walls.forEach((wall) => {
        mW.scene.add(wall);
    });
    mW.loop.clock.startTime = 0;
    mW.loop.updatableLists.push(mW.man);
    mW.loop.updatableLists.push(mW.maze);
    document.addEventListener("gameover", mW.gameoverListener);
    mW.correctAnswers = 0;
    document.addEventListener("questionAnswered", (event: Event) => {
        if (!(event instanceof CustomEvent)) return;
        const { isCorrect } = event.detail;
        if (isCorrect) mW.correctAnswers++;
    });
    Man.onTick = (man: Man, delta: number) => {
        man.update(mW.keyboard, mW.scene, mW.maze, delta, mW.questions);
    };
}
