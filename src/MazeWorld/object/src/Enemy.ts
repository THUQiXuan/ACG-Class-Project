import * as THREE from "three";
import { Maze } from './Maze';
import { MovableObject } from "../BaseObject";
class Enemy extends MovableObject {
    constructor(name:string, texture: THREE.Texture) {
        super("enemy", name);
    }
    tick(delta:number) {
    }
}

export { Enemy };

