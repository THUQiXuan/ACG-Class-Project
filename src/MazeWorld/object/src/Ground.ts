import * as THREE from "three";
import { BaseObject } from "../BaseObject";

class Ground extends BaseObject {
    planSize: number;

    texture: THREE.Texture;
    geometry: THREE.PlaneGeometry;
    planeMaterial: THREE.MeshStandardMaterial;

    constructor(name: string, texture: THREE.Texture) {
        super("ground", name);
        this.texture = texture;
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;
        this.texture.repeat.set(10, 10); 
        this.geometry = new THREE.PlaneGeometry(100, 100); 
        this.planeMaterial = new THREE.MeshStandardMaterial({ map: texture });
        this.mesh = new THREE.Mesh(this.geometry, this.planeMaterial);
        this.mesh.position.set(10, 10, 0);
        // this.mesh.rotation.x = -Math.PI / 2;
        this.planSize = texture.image.width;
    }

}

export { Ground };