import * as THREE from 'three';
declare module 'OBB' {
    class OBB {
        constructor(center: THREE.Vector3, halfSize: THREE.Vector3, rotation: THREE.Matrix3);
        intersectsBox3(box: THREE.Box3): boolean;
    }
    export { OBB };
}

