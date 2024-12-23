import * as THREE from "three";
import { disposeMeshes } from "../utils/Mesh";

abstract class BaseObject {
  type: string;
  name: string;
  mesh: THREE.Object3D;

  constructor(type: string, name: string) {
    this.type = type;
    this.name = name;
  }

  destruct() {
    this.mesh.parent?.remove(this.mesh);
    disposeMeshes(this.mesh);
  }
}

abstract class MovableObject extends BaseObject {
  constructor(type: string, name: string) {
    super(type, name);
  }

  abstract tick(delta: number): void;
}

export { BaseObject, MovableObject };
