import * as THREE from 'three';
import { Game } from '../functions/game';
import { groupBoxes } from './object';
import { liftEffect, snowEffect, scaleEffect, upDownEffect} from './specialEffect';


export async function LoadMap(gm: Game, anime_num: number) {
    for (let i = 1; i <= anime_num; i++) {
        gm.loader.load(gm.worldId + '/anime/' + i + '.gltf', async (gltf) => {
            const object = gltf.scene.children[0].children[0] as THREE.Mesh;
            const pos = object.position.clone();
            object.position.set(-pos.x, pos.y, -pos.z)
            object.castShadow = true
            object.receiveShadow = true
            const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
            quaternion.multiply(object.quaternion)
            object.quaternion.copy(quaternion)
            gm.scene.add(object);
            const mixer = new THREE.AnimationMixer(object);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });
            gm.mixers.push(mixer);
        }, undefined, (error) => {
                console.error(error);
        });
    }

    gm.loader.load(gm.worldId+'/world.gltf', async (gltf) => {
        gltf.scene = gltf.scene.children[0] as THREE.Group;
        const group = gltf.scene as THREE.Group;
        const chd = [...group.children];
        chd.forEach((groupItem) => {
            groupItem.castShadow = true
            groupItem.receiveShadow = true
            if (groupItem.name.startsWith('diamond')) {
                ++gm.totalDiamonds;
                gm.updateList.push({
                    update: (delta: number) => {groupItem.rotation.z += 1 * delta}
                });
                gm.scene.add(groupItem);
                gm.diamondCollections.push(groupItem as THREE.Mesh)
            }
            else if (groupItem.name.startsWith('End')) {
                gm.EndingMeshes.push(groupItem as THREE.Mesh)
                gm.scene.add(groupItem);
            }
            else if(groupItem.name.startsWith('road')) {
                const items = groupBoxes(groupItem.children as THREE.Mesh[],  groupItem.position, false)
                groupItem.children = []
                gm.scene.add(items)
                gm.addObject(items, 'box')
                if (groupItem.name.endsWith('lift')) {
                    liftEffect(gm, items, -2, 12, 500, false)
                }
            }
            else if (groupItem.name.startsWith('floor') || groupItem.name.startsWith('plane')) {
                const items = groupBoxes(groupItem.children as THREE.Mesh[], groupItem.position, true)
                groupItem.children = []
                if (!groupItem.name.endsWith('invisible')) {
                    gm.scene.add(items)
                }
                gm.addObject(items, groupItem.name.startsWith('floor') ? 'floor' : 'plane')
                if (groupItem.name.endsWith('lift')) {
                    liftEffect(gm, items, -10, 8, 500, false)
                }
            }
            else if(groupItem.name.startsWith('lift')) {
                liftEffect(gm, groupItem as THREE.Group, 50, 10, 5000, true)
            }
            else if(groupItem.name.startsWith('scale')) {
                scaleEffect(gm, groupItem as THREE.Group, 1000)
            }
            else if(groupItem.name.startsWith('CameraMove')) {
                const vec33 = groupItem.scale.clone();
                const is_last = groupItem.name.endsWith('END')
                gm.updateList.push({
                    update: (delta: number) => {
                        if (groupItem.position.z - groupItem.position.x < gm.line.line!.position.z - gm.line.line!.position.x) {
                            if(groupItem.userData.used == undefined) {
                                groupItem.userData.used = true
                                if (!is_last)
                                    gm.line.moveCamera(vec33, 0.2)
                                else {
                                    gm.line.moveCamera(vec33.add(gm.line.line?.position!), 0.03)
                                    const new_target = new THREE.Vector3(0, 0, 0)
                                    if (gm.world.lineStatus.direction == 'x') {
                                        new_target.x = -15
                                    }
                                    else {
                                        new_target.z = 15
                                    }
                                    gm.line.moveCameraTarget(new_target, 0.1)
                                    gm.win()
                                } 
                            }
                        }
                    }
                });
            }
            else if(groupItem.name.startsWith('up_down')) {
                upDownEffect(gm, groupItem as THREE.Group, 1, -2, 400)
            }
            else if(groupItem.name.startsWith('new_osu')) {
                // const children = [...groupItem.children];
                // for (let i = 0; i < children.length; i++) {
                //     const item = children[i] as THREE.Mesh;
                //     item.position.add(groupItem.position)
                //     gm.updateList.push({
                //         update: (delta: number) => {
                //             if (item.position.z -gm.line.line!.position.z < 1 && gm.line.line!.position.x - item.position.x < 1) {
                //                 if(item.userData.used == undefined) {
                //                     item.userData.used = true
                //                     gm.click()
                //                 }
                //             }
                //         }
                //     });
                // }
            }
            else {
                groupItem.traverse((child) => {
                    child.castShadow = true
                    child.receiveShadow = true
                });
                groupItem.visible = true;
                gm.scene.add(groupItem);
            }
        });
    }, undefined, (error) => {
        console.error(error);
    });
    if (gm.config.snowy == true) {
        snowEffect(gm);
    }
    gm.loader.load('headphone.gltf', (object) => {
        const tmp = object.scene.children[0] as THREE.Group;
        tmp.position.set(0, -1.42, 0.35)
        tmp.userData.id = 1
        tmp.visible = false
        gm.Models.push(tmp)
        gm.line.line!.add(tmp)
    })
    gm.loader.load('hat.gltf', (object) => {
        const tmp = object.scene.children[0] as THREE.Group;
        tmp.position.set(0, 0.52, 0)
        tmp.userData.id = 2
        tmp.visible = false
        gm.Models.push(tmp)
        gm.line.line!.add(tmp)
    })
    gm.loader.load('musical-note.gltf', (object) => {
        const tmp = object.scene.children[0] as THREE.Group;
        tmp.position.set(0, 0.52, 0)
        tmp.userData.id = 2
        tmp.children.forEach((child) => {
            child.visible = false
        });
        gm.effectModels.push(tmp)
    })
}