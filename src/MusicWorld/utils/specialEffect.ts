import { Vec3 } from 'cannon-es';
import * as THREE from 'three';
import Game from '../functions/game';
import TWEEN from '@tweenjs/tween.js';
export function createCrashEffect(normal: Vec3, gm: Game ) {
    gm.scene.remove(gm.line.line as any);
    const numSprites = 30;
    const spriteSize = 0.2;
    const baseSpeed = 0.01;

    for (let i = 0; i < numSprites; i++) {
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * spriteSize * 2,
            (Math.random() - 0.5) * spriteSize * 2,
            (Math.random() - 0.5) * spriteSize * 2
        );
        const spriteMaterial = new THREE.SpriteMaterial({color: gm.line.lineColor.color});
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(
            gm.line.line!.position.x + offset.x - normal.x * 0.01,
            gm.line.line!.position.y + offset.y - normal.y * 0.01 + 1,
            gm.line.line!.position.z + offset.z - normal.z * 0.01
        );
        sprite.scale.set(spriteSize, spriteSize, spriteSize);
        gm.scene.add(sprite);

        const randomVerticalSpeed = Math.random() * baseSpeed;
        const speed = new THREE.Vector3(
            -normal.x * baseSpeed + offset.x * 0.05,
            randomVerticalSpeed,
            -normal.z * baseSpeed + offset.z * 0.05
        );
        gm.updateList.push({
            update: (delta: number) => {
                sprite.position.add(speed);
                speed.y -= 0.001;
                if (sprite.position.y < gm.line.line!.position.y - 1) {
                    gm.scene.remove(sprite);
                }
            }
        });
    }
}

export function snowEffect(gm: Game) {
    const numSnowflakes = 200;
    const snowflakeSize = 0.3;
    const snowflakes: THREE.Sprite[] = [];
    const textureLoader = new THREE.TextureLoader();
    const snowflakeMaterial = new THREE.SpriteMaterial({ 
        color: 0xffffff
    });
    for (let i = 0; i < numSnowflakes; i++) {
        const sprite = new THREE.Sprite(snowflakeMaterial);
        sprite.position.set(
            -Math.random() * 40 + gm.camera.position.x,
            Math.random() * 40 + gm.camera.position.y,
            Math.random() * 40 + gm.camera.position.z
        );
        sprite.userData.velocity = new THREE.Vector3(
            Math.random() * 0.1,
            -0.05,
            -Math.random() * 0.1
        );
        sprite.scale.set(snowflakeSize, snowflakeSize, snowflakeSize);
        gm.scene.add(sprite);
        snowflakes.push(sprite);
    }
    gm.updateList.push({
        update: (delta: number) => {
            snowflakes.forEach((sprite) => {
                sprite.position.add(sprite.userData.velocity);
                if (sprite.position.y < -1 || (sprite.position.x - gm.camera.position.x) > 20 || (sprite.position.z - gm.camera.position.z) < -20) {
                    sprite.position.x = (-Math.random() * 40) + gm.camera.position.x;
                    sprite.position.y = (Math.random() * 20) + gm.camera.position.y;
                    sprite.position.z = (Math.random() * 40) + gm.camera.position.z;
                    sprite.userData.velocity = new THREE.Vector3(
                        Math.random() * 0.1,
                        -0.05,
                        -Math.random() * 0.1
                    );
                } else {
                    sprite.position.add(sprite.userData.velocity);
                }
            });
        }
    });
};


export function liftEffect(gm: Game, group: THREE.Group, height:number, threshold: number, time: number, first_visible: boolean) {
    const children = [...group.children];
    children.forEach((item) => {
        item.castShadow = true
        item.receiveShadow = true
        item.visible = first_visible
        const width = first_visible ? item.scale.x: ((item as THREE.Mesh).geometry as THREE.BoxGeometry).parameters.width
        const depth = first_visible ? item.scale.z: ((item as THREE.Mesh).geometry as THREE.BoxGeometry).parameters.depth
        gm.updateList.push({
            update: (delta: number) => {
                if (item.position.z - item.position.x - width / 2 - depth / 2
                    < gm.line.line!.position.z - gm.line.line!.position.x + threshold) {
                    if(item.userData.used == undefined) {
                        item.visible = true
                        item.userData.used = true
                        if (height < 0) {
                            item.position.y += height
                            gm.Group.add(new TWEEN.Tween(item.position)
                            .to({ y: item.position.y - height }, time)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start());
                        }
                        else {
                            gm.Group.add(new TWEEN.Tween(item.position)
                            .to({ y: item.position.y + height }, time)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .start());
                        }
                    }
                }
            }
        });
    });
    gm.scene.add(group);
}

export function scaleEffect(gm: Game, group: THREE.Group, time: number) {
    const children = [...group.children];
    children.forEach((item) => {
        item.castShadow = true
        item.receiveShadow = true
        item.visible = false
        gm.updateList.push({
            update: (delta: number) => {
               if (item.position.z - item.position.x < gm.line.line!.position.z - gm.line.line!.position.x + 10) {
                    if(item.userData.used == undefined) {
                        item.userData.used = true
                        const final = item.scale.clone();
                        item.scale.set(0, 0, 0)
                        item.visible = true;
                        gm.Group.add(new TWEEN.Tween(item.scale)
                        .to(final, time)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .start());
                    }
                }
            }
        });
    });
    gm.scene.add(group);
}

export function upDownEffect(gm: Game, group: THREE.Group, height:number, threshold: number, time: number) {
    const children = [...group.children];
    children.forEach((item) => {
        item.castShadow = true
        item.receiveShadow = true
        gm.updateList.push({
            update: (delta: number) => {
                if (item.position.z - item.position.x - item.scale.x/2 - item.scale.z/2
                    < gm.line.line!.position.z - gm.line.line!.position.x + threshold) {
                    if(item.userData.used == undefined) {
                        item.userData.used = true
                        const tar1 = item.position.y
                        const tar2 = item.position.y - height
                        gm.Group.add(new TWEEN.Tween(item.position)
                            .to({ y: tar2 }, time)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .onComplete(() => {
                                gm.Group.add(new TWEEN.Tween(item.position)
                                    .to({ y: tar1 }, time - 100)
                                    .easing(TWEEN.Easing.Quadratic.In)
                                    .start());
                            })
                            .start());
                    }
                }
            }
        });
    });
    gm.scene.add(group);
}


export function noteEffect(note: THREE.Mesh, gm: Game) {
    const newNote = note.clone()
    newNote.position.add(gm.line.line!.position)
    newNote.visible = true
    gm.scene.add(newNote)
    const tar = newNote.scale.clone().multiplyScalar(2)
    const tween2 = new TWEEN.Tween(newNote.scale)
        .to(tar, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
        .onComplete(() => {
            gm.scene.remove(newNote)
            gm.Group.remove(tween2)
        });
    
    gm.Group.add(tween2);
}

export function flashEffect(gm: Game) {
    const flash = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.01, 1),
        new THREE.MeshBasicMaterial({ color: gm.line.lineColor.color, transparent: true, opacity: 0.8 })
    );
    flash.position.set(0, 0.5, 0)
    flash.position.add(gm.line.line!.position)
    flash.visible = true
    gm.scene.add(flash)
    const tween = new TWEEN.Tween(flash.scale)
        .to(new THREE.Vector3(4, 0.01, 4), 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
        .onComplete(() => {
            gm.scene.remove(flash)
            gm.Group.remove(tween)
        });
    const tween2 = new TWEEN.Tween(flash.material)
        .to({ opacity: 0 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
        .onComplete(() => {
            gm.Group.remove(tween2)
        });
    gm.Group.add(tween);
    gm.Group.add(tween2);
}