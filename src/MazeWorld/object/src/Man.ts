import * as THREE from "three";
import { MovableObject } from "../BaseObject";
import { Maze } from './Maze';
import { checkCollisionManWithMaze } from "../../utils/Collision";
import { Audio } from 'three';


class Man extends MovableObject {
    bboxParameters = { width: 0.51, height: 0.51, depth: 0.51 };
    // proceed: number = 0;
    // rotate: number = 0;
    proceedUnit: number = 0.25;
    // rotateUnit: number = 2;
    proceedUpKey: string = "ArrowUp";
    proceedDownKey: string = "ArrowDown";
    proceedLeftKey: string = "ArrowLeft";
    proceedRightKey: string = "ArrowRight";

    texture: THREE.Texture | null;
    material: THREE.MeshPhongMaterial;
    geometry: THREE.SphereGeometry;

    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    friction_coefficient: number = 0.05;
    bounce_coefficient: number = 0.85;
    pickUpSound: THREE.Audio;

    constructor(name: string, texture: THREE.Texture | null) {
        super("man", name);
        this.texture = texture;
        if (this.texture == null)
            this.material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        else
            this.material = new THREE.MeshPhongMaterial({ map: this.texture });
        this.geometry = new THREE.SphereGeometry(0.25, 32, 16);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(1, 1, 1);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        //this.pickUpSound = null;
    }

    reset() {
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
    }

    update(keyboard: { [key: string]: number }, scene: THREE.Scene, maze: Maze, delta: number, questions: any[]) {
        this._updateSpeed(keyboard, delta);
        this._updatePosition(maze, scene,questions);
    }
    
    shakeCamera(camera: THREE.Camera) {
        const intensity = 0.03;
        const duration = 100;
        const shakeFrequency = 200;
    
        const originalPosition = camera.position.clone();
        const startTime = Date.now();
    
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > duration) {
                clearInterval(interval);
                camera.position.copy(originalPosition);
                return;
            }
            camera.position.set(
                originalPosition.x + (Math.random() - 0.5) * intensity,
                originalPosition.y + (Math.random() - 0.5) * intensity,
                originalPosition.z + (Math.random() - 0.5) * 5 * intensity
            );
        }, 1000 / shakeFrequency);
    }
    
    _updateSpeed(keyboard: { [key: string]: number }, delta: number) {
        const impulse = new THREE.Vector3(
            ((keyboard[this.proceedRightKey] || 0) - (keyboard[this.proceedLeftKey] || 0)) * delta,
            ((keyboard[this.proceedUpKey] || 0) - (keyboard[this.proceedDownKey] || 0)) * delta,
            0
        ).multiplyScalar(this.proceedUnit);
        this.velocity.multiplyScalar(1 - this.friction_coefficient);
        this.acceleration.set(impulse.x, impulse.y, 0);
        this.velocity.add(this.acceleration);
    }

    _updatePosition(maze: Maze, scene: THREE.Scene, questions: any[]) {
        const existingContainer = document.getElementById("question-container");
        if (existingContainer) {
            return;
        }
        const new_man = new Man("new", null);
        new_man.mesh.position.copy(this.mesh.position);
        new_man.mesh.rotation.copy(this.mesh.rotation);
        new_man.mesh.position.add(this.velocity);
    
        const in_maze = maze.inMaze(new_man.mesh.position);
        if (!in_maze) {
            document.dispatchEvent(new CustomEvent("gameover"));
            return;
        }
    
        maze.connectors.forEach((connector) => {
            if (!connector.userData.answered) {
                const distance = connector.position.distanceTo(new_man.mesh.position);
                if (distance < 0.5) {
                    this.triggerQuestion(connector, questions);
                }
            }
        });
    
        const collisionResult = checkCollisionManWithMaze(this, maze);
        if (collisionResult.collisionDetected) {
            const camera = scene.userData.camera as THREE.Camera;
            this.shakeCamera(camera);
            console.log(collisionResult, this.velocity);
            this.mesh.position.copy(new_man.mesh.position);
    
            if (collisionResult.horizontalCollision === 'left' && this.velocity.x < 0) {
                this.mesh.position.x -= this.velocity.x;
                this.velocity.x = -this.velocity.x * this.bounce_coefficient;
            }
            if (collisionResult.horizontalCollision === 'right' && this.velocity.x > 0) {
                this.mesh.position.x -= this.velocity.x;
                this.velocity.x = -this.velocity.x * this.bounce_coefficient;
            }
            if (collisionResult.verticalCollision === 'front' && this.velocity.y > 0) {
                this.mesh.position.y -= this.velocity.y;
                this.velocity.y = -this.velocity.y * this.bounce_coefficient;
            }
            if (collisionResult.verticalCollision === 'back' && this.velocity.y < 0) {
                this.mesh.position.y -= this.velocity.y;
                this.velocity.y = -this.velocity.y * this.bounce_coefficient;
            }
    
            this.mesh.position.add(this.velocity);
        } else {
            this.mesh.position.copy(new_man.mesh.position);
        }
    }
    
    triggerQuestion(connector: THREE.Mesh, questions: any[]) {
        if (!connector.userData.answered) {
            connector.userData.answered = true;
            const question = questions[Math.floor(Math.random() * questions.length)];
    
            const existingContainer = document.getElementById("question-container");
            if (existingContainer) {
                document.body.removeChild(existingContainer);
            }
    
            if (this.pickUpSound) {
                this.pickUpSound.play();
            }
    
            const questionContainer = document.createElement("div");
            questionContainer.id = "question-container";
    
            const questionText = document.createElement("p");
            questionText.textContent = question.text;
            questionContainer.appendChild(questionText);
    
            question.options.forEach((option:string, index:number) => {
                const button = document.createElement("button");
                button.textContent = option;
                button.onclick = () => {
                    const isCorrect = index === question.correctIndex;
                    alert(isCorrect ? "Correct!" : "Wrong!");
                    document.body.removeChild(questionContainer);
    
                    document.dispatchEvent(
                        new CustomEvent("questionAnswered", { detail: { isCorrect } })
                    );
    
                    connector.visible = false;
                };
    
                questionContainer.appendChild(button);
            });
    
            document.body.appendChild(questionContainer);
        }
    }
    

    static onTick(man: Man, delta: number) {
    }

    tick(delta: number): void {
        if (!this.mesh) {
            return;
        }
        Man.onTick(this, delta);
    }
    
}

export { Man };
