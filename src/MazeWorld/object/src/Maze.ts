// Maze.ts
import * as THREE from 'three';
import { BaseObject } from "../BaseObject";
import { Water } from 'three/examples/jsm/objects/Water.js';

class Maze extends BaseObject {
    field: Array<Array<boolean>>;
    texture: THREE.Texture;
    geometry: THREE.BoxGeometry;
    planeMaterial: THREE.MeshStandardMaterial;
    walls: THREE.Mesh[] = [];
    dimension: number;
    segmentSize: number;
    connectors: THREE.Mesh[] = [];
    water: Water; // 新增水面属性

    constructor(name: string, texture: THREE.Texture) {
        super("maze", name);
        this.texture = texture;
        this.geometry = new THREE.BoxGeometry(1, 1, 2);
        this.planeMaterial = new THREE.MeshStandardMaterial({ map: texture });
    }

    init(worldId: number, scene: THREE.Scene, diamondModel: THREE.Object3D) {
        this.walls = [];
        this.connectors = [];
        this.dimension = 40;
        this.segmentSize = Math.floor(this.dimension / 5); // 每个部分的大小
        this.field = Array.from({ length: this.dimension }, () => new Array(this.dimension).fill(true));

        let startX = 1, startY = 1; // 起始点
        for (let i = 0; i < 5; i++) {
            const endX = Math.min(startX + this.segmentSize - 1, this.dimension - 1);
            const endY = Math.min(startY + this.segmentSize - 1, this.dimension - 1);

            // 生成每个部分的路径
            this.field = this.iterateSegment(this.field, startX, startY, endX, endY);

            // 添加红点衔接
            if (i < 4) {
                const connectorX = Math.min(endX + 1, this.dimension - 1);
                const connectorY = Math.min(endY + 1, this.dimension - 1);
                if (connectorX < this.dimension && connectorY < this.dimension) {
                    this.field[connectorX][connectorY] = false; // 确保在范围内
                    this.field[connectorX-1][connectorY] = false;
                    // this.field[connectorX][connectorY-1] = false;
                    this.field[connectorX-1][connectorY-1] = false;
                    this.field[connectorX-2][connectorY-1] = false;
                    // this.field[connectorX-1][connectorY-2] = false;
                    this.field[connectorX+1][connectorY] = false;
                    // this.field[connectorX][connectorY+1] = false;
                    this.field[connectorX+1][connectorY+1] = false;
                    // this.field[connectorX+2][connectorY+1] = false;
                    this.field[connectorX+1][connectorY+2] = false;
                    this.addConnector(scene, connectorX, connectorY, diamondModel);
                }
                startX = connectorX + 1; // 更新下一部分的起始点
                startY = connectorY + 1;
            }
        }

        this.field[1][1] = false;
        this.field[1][2] = false;
        this.field[2][1] = false;
        this.field[this.dimension - 1][this.dimension - 2] = false;

        this.generateMazeMesh(this.field, this.texture);

        // 添加水面
        // this.addWater(scene);
    }

    iterateSegment(
        field: Array<Array<boolean>>,
        startX: number,
        startY: number,
        endX: number,
        endY: number
    ): boolean[][] {
        function isInBounds(x: number, y: number): boolean {
            return x >= startX && x <= endX && y >= startY && y <= endY;
        }

        const iterate = (x: number, y: number) => {
            if (!isInBounds(x, y)) return; // 检查边界

            field[x][y] = false;

            while (true) {
                let directions: [number, number][] = [];
                if (x > startX + 1 && isInBounds(x - 2, y) && field[x - 2][y]) directions.push([-1, 0]);
                if (x < endX - 1 && isInBounds(x + 2, y) && field[x + 2][y]) directions.push([1, 0]);
                if (y > startY + 1 && isInBounds(x, y - 2) && field[x][y - 2]) directions.push([0, -1]);
                if (y < endY - 1 && isInBounds(x, y + 2) && field[x][y + 2]) directions.push([0, 1]);

                if (directions.length === 0) return;

                const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
                field[x + dx][y + dy] = false;
                iterate(x + dx * 2, y + dy * 2);
            }
        };

        iterate(startX + 1, startY + 1); // 从该部分的左上角开始生成路径
        return field;
    }

    addConnector(scene: THREE.Scene, x: number, y: number, diamondModel: THREE.Object3D) {
        if (!diamondModel) {
            console.error('Diamond model is not loaded.');
            return;
        }

        // Clone the diamond model to create a new instance
        const gate = diamondModel.clone();
        
        const boundingBox = new THREE.Box3().setFromObject(gate);

        // 获取包围盒的尺寸
        const size = new THREE.Vector3();
        boundingBox.getSize(size); // size.x, size.y, size.z 是模型的原始尺寸

        // Scale the model
        const targetWidth = 1;
        const targetHeight = 1;
        const targetDepth = 2;
        const scaleX = targetWidth / size.x;  // 缩放比例（x 方向）
        const scaleY = targetDepth / size.y; // 缩放比例（y 方向）
        const scaleZ = targetHeight / size.z; // 缩放比例（z 方向）

        gate.scale.set(scaleX * 0.6, scaleY * 0.2, scaleZ * 0.6); // 设置缩放比例

        // Set position and rotation
        gate.position.set(x, y, 1); // Adjust height
        gate.rotation.x = Math.PI / 2;

        // Add lighting effects
        const pointLight = new THREE.PointLight(0x00ffff, 1, 5);
        pointLight.position.set(gate.position.x, gate.position.y, gate.position.z);
        scene.add(pointLight);

        // Save bounding box for collision detection
        gate.userData.boundingBox = boundingBox;
        gate.userData.isConnector = true;

        // Add to scene and connectors array
        scene.add(gate);
        this.connectors.push((gate as THREE.Mesh));
    }

    generateMazeMesh(field: Array<Array<boolean>>, texture: THREE.Texture) {
        for (let i = 0; i < field.length; i++) {
            for (let j = 0; j < field[0].length; j++) {
                if (field[i][j]) {
                    const cube = new THREE.Mesh(this.geometry, this.planeMaterial);
                    cube.position.set(i, j, 1 / 2);
                    this.walls.push(cube);
                }
            }
        }
    }

    addWater(scene: THREE.Scene) {
        const waterGeometry = new THREE.PlaneGeometry(4, 4); // 宽6，高3

        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('assets/textures/water2.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 1.0,
            sunDirection: new THREE.Vector3(0, 0, 1).normalize(),
            sunColor: 0x66ccff, // 确保 sunColor 为纯白色
            waterColor: 0x66ccff, // 你可以尝试调整这个颜色，例如 0x3399ff
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        });

        // this.water.rotation.x = -Math.PI / 2; // 让水面水平
        this.water.position.set(5, 10.5, 2.1); // 位置在 [3,7] 到 [7,11] 区域的中心
        this.water.receiveShadow = true;
        this.water.material.transparent = true;
        this.water.material.opacity = 1.0; // 确保不透明

        scene.add(this.water);
    }

    // 更新水面的时间参数
    update(delta: number) {
        if (this.water) {
            this.water.material.uniforms['time'].value += delta;
        }
        // 其他需要更新的对象
    }

    inMaze(position: THREE.Vector3) {
        const x = Math.floor(position.x + 0.5);
        const y = Math.floor(position.y + 0.5);
        if (x == this.dimension && y == this.dimension - 2) {
            return false;
        }
        return true;
    }
}

export { Maze };
