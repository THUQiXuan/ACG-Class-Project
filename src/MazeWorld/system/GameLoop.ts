import * as THREE from "three";
import { Clock } from "three";
import { Man } from "../object/src/Man";
class GameLoop {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  clock: Clock;
  updatableLists: any[];
  onUpdate: (delta: number) => void;


  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.clock = new Clock();
    this.updatableLists = [];
    this.onUpdate = () => {}; // 初始化为空函数
  }

  start() {
    this.renderer.setAnimationLoop(() => {
        this.tick();
        this.renderer.render(this.scene, this.camera);
    });
    this.clock.getDelta();
  }
  // tick() {
  //   const delta = this.clock.getDelta();
  //   if (this.onUpdate) {
  //     this.onUpdate(delta);
  // }
  //   this.updatableLists.forEach(updatable => updatable.tick(delta));
  // }
  tick() {
    const delta = this.clock.getDelta();

    // 调用每个注册对象的 tick 或 onTick 方法
    this.updatableLists.forEach((updatable) => {
        if (updatable.tick) {
            updatable.tick(delta); // 调用标准 tick 方法
        } else if (typeof (updatable as any).onTick === 'function') {
            (updatable as any).onTick(delta); // 支持类似 onTick 的静态方法
        }
    });

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

}

export { GameLoop };
