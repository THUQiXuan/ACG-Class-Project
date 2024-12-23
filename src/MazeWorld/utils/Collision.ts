import * as THREE from "three";
import { OBB } from "../../OBB";
import { Man } from "../object/src/Man";
import { Maze } from "../object/src/Maze";

function checkCollisionManWithMaze(man: Man, maze: Maze) {
    const { width, height, depth } = man.bboxParameters;
    const obb = new OBB(
        man.mesh.position,
        new THREE.Vector3(width / 2, height / 2, depth / 2),
        new THREE.Matrix3().setFromMatrix4(man.mesh.matrix)
    );

    let collisionDetected = false;
    let verticalCollision: 'front' | 'back' | null = null;
    let horizontalCollision: 'left' | 'right' | null = null;

    for (let i = 0; i < maze.walls.length; i++) {
        const box3 = new THREE.Box3().setFromObject(maze.walls[i]);
        if (obb.intersectsBox3(box3)) {
            collisionDetected = true;
            const wallCenter = new THREE.Vector3();
            box3.getCenter(wallCenter);
            const manCenter = man.mesh.position.clone();
            const dx = Math.abs(manCenter.x - wallCenter.x);
            const dy = Math.abs(manCenter.y - wallCenter.y);
            if (dx > dy) {
                if (manCenter.x < wallCenter.x) {
                    horizontalCollision = 'right';
                }
                else {
                    horizontalCollision = 'left';
                }
            } else {
                if (manCenter.y < wallCenter.y) {
                    verticalCollision = 'front';
                }
                else {
                    verticalCollision = 'back';
                }
            }
        }
    }
    return {
        collisionDetected,
        verticalCollision,
        horizontalCollision
    };
}

export { checkCollisionManWithMaze };