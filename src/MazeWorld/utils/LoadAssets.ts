import * as THREE from 'three';
import { MazeWorld } from '../MazeWorld';
import { AudioLoader, AudioListener, Audio } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';


export async function loadAssets(mW: MazeWorld, worldId: number) {
    let promises: Promise<any>[] = [];
    const audioLoader = new AudioLoader();
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);
    function texturePromise(path: string) {
        return new Promise<THREE.Texture>(
            (resolve, reject) => {
                textureLoader.load(path, (texture) => {
                    resolve(texture);
                });
            }
        );
    }
    promises.push(texturePromise('assets/ground/concrete.png').then((texture) => {
        mW.textureDict['ground'] = texture;
    }));
    promises.push(texturePromise('assets/maze/brick.png').then((texture) => {
        mW.textureDict['maze'] = texture;
    }));
    mW.listener = new AudioListener();
    mW.camera.add(mW.listener);

    promises.push(new Promise<void>((resolve, reject) => {
        audioLoader.load('assets/audio/bgm.mp3', (buffer) => {
            mW.backgroundMusic = new Audio(mW.listener);
            mW.backgroundMusic.setBuffer(buffer);
            mW.backgroundMusic.setLoop(true);
            mW.backgroundMusic.setVolume(0.5);
            resolve();
        }, undefined, (err) => {
            console.error('加载背景音乐出错:', err);
            reject(err);
        });
    }));

    promises.push(new Promise<void>((resolve, reject) => {
        audioLoader.load('assets/audio/question.mp3', (buffer) => {
            mW.pickUpSound = new Audio(mW.listener);
            mW.pickUpSound.setBuffer(buffer);
            mW.pickUpSound.setLoop(false);
            mW.pickUpSound.setVolume(1.0);
            resolve();
        }, undefined, (err) => {
            console.error('加载捡起音效出错:', err);
            reject(err);
        });
    }));

    mW.questions = [];
    promises.push(fetch(`assets/question/questions_${worldId+1}.json`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.statusText}`);
            }
            return response.json();
        })
        .then((questions) => {
            mW.questions = questions;
        })
        .catch((err) => {
            console.error(`Failed to load questions for world ${worldId}:`, err);
            mW.questions = []; // 设置为空数组以防止未定义
            alert(`加载关卡 ${worldId} 的题目时出错，请联系支持团队。`);
        })
    );
    
    promises.push(new Promise<void>((resolve, reject) => {
        gltfLoader.load(
            'assets/maze/diamond.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {                       
                        ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x00ffff); // Set emissive color
                        ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5; // Set emissive intensity
                    }
                });

                mW.diamondModel = gltf.scene; // Save loaded model to a property
                resolve();
            },
            undefined,
            (error) => {
                console.error('Failed to load .glb model:', error);
                reject(error);
            }
        );
    }));
    
    await Promise.all(promises);
}
