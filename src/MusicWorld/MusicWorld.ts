import { Game } from "./functions/game";
import * as THREE from 'three';
import iro from '@jaames/iro';
interface CustomWindow extends Window {
    worldTree: any;
    auth: any;
}

declare let window: CustomWindow;
class MusicWorld {
    game: Game;
    worldId: number;
    lineheadColor: string;
    keydownHandler: (event: KeyboardEvent) => void;
    goBackToWorldTree: () => void;
    constructor() {
       
    }
    handleKeyDown(event: KeyboardEvent) {
        if (event.code !== 'Space') 
            return;
        if (this.game.tags.status === 'run') {
            this.game.click();
        } else if (this.game.tags.status === 'begin') {
            this.game.start();
        }        
    }
    loadLineheadSelection() {
        document.getElementById('character-container')!.style.display = 'block';
        var colorPicker = iro.ColorPicker("#appearance-selection", {
            width: 250,
            color: "0xffffff",
          });
        colorPicker.on('color:change', (color: iro.Color) => {
            const colorHex = color.hexString;
            this.game.line.lineColor = { color: parseInt(colorHex.replace('#', '0x')) };
            (this.game.line.line!.material as THREE.MeshPhongMaterial).color.set(colorHex);
        });

        document.getElementById('apply-button')?.addEventListener('click', async () => {
            this.game.tags.status = 'begin';
            document.getElementById('character-container')!.style.display = 'none';

        });

        document.getElementById('headphone-button')?.addEventListener('click', async () => {
            if (this.game.lineConfig1 === 2) {
                alert("You can not wear headphone and hat at the same time!");
                return;
            }
            const headphoneButton = document.getElementById('headphone-button');
            if (headphoneButton?.classList.contains('active')) {
                headphoneButton.classList.remove('active');
                this.game.lineConfig1 = 0;
            } else {
                headphoneButton?.classList.add('active');
                this.game.lineConfig1 = 1;
            }
            this.game.updateConfig();
        });
        document.getElementById('hat-button')?.addEventListener('click', async () => {
            if (this.game.lineConfig1 === 1) {
                alert("You can not wear headphone and hat at the same time!");
                return;
            }
            const headphoneButton = document.getElementById('hat-button');
            if (headphoneButton?.classList.contains('active')) {
                headphoneButton.classList.remove('active');
                this.game.lineConfig1 = 0;
            } else {
                headphoneButton?.classList.add('active');
                this.game.lineConfig1 = 2;
            }
            this.game.updateConfig();
        });
        document.getElementById('flash-button')?.addEventListener('click', async () => {
            if (this.game.lineConfig2 === 2) {
                alert("You can not use two special effects at the same time!");
                return;
            }
            const flashButton = document.getElementById('flash-button');
            if (flashButton?.classList.contains('active')) {
                flashButton.classList.remove('active');
                this.game.lineConfig2 = 0;
            } else {
                flashButton?.classList.add('active');
                this.game.lineConfig2 = 1;
            }
            this.game.updateConfig();
        });
        document.getElementById('note-button')?.addEventListener('click', async () => {
            if (this.game.lineConfig2 === 1) {
                alert("You can not use two special effects at the same time!");
                return;
            }
            const noteButton = document.getElementById('note-button');
            if (noteButton?.classList.contains('active')) {
                noteButton.classList.remove('active');
                this.game.lineConfig2 = 0;
            } else {
                noteButton?.classList.add('active');
                this.game.lineConfig2 = 2;
            }
            this.game.updateConfig();
        });
    }
    async init(worldId: number) {
        this.keydownHandler = this.handleKeyDown.bind(this);
        this.goBackToWorldTree = this.handleGoBackToWorldTree.bind(this);
        this.worldId = worldId;
        const worldConfig = await fetch(String(worldId) + '/config.json').then(res => res.json());
        this.game = new Game({
            skyColor: new THREE.Color(worldConfig.skyColor), //'#ffffff'
            lineColor: { color: worldConfig.color }, //0xf5504c
            lineSpeed: 15.08,
            shadowDeep: 0.3,
            canvaName: 'three',
            camera: {
                pov: worldConfig.cameraPov,
                position: new THREE.Vector3(worldConfig.cameraPos.x, worldConfig.cameraPos.y, worldConfig.cameraPos.z),
            },
            lightPosition: worldConfig.lightPos,
            fogColor: new THREE.Color(worldConfig.fogColor),
            fogDensity: worldConfig.fogDensity,
            snowy: worldConfig.snowy,
            target: new THREE.Vector3(worldConfig.target.x, worldConfig.target.y, worldConfig.target.z)
        }, 
        new THREE.Vector3(worldConfig.headPos.x, worldConfig.headPos.y, worldConfig.headPos.z)
        ,worldId);
        this.game.addMusic(worldId + '/music.mp3', 'die_sound.wav', 'diamond.mp3', 1);
        await this.game.loadMap(worldConfig.anime_num)
        document.getElementById('gameover-continue')!.addEventListener('click', this.goBackToWorldTree);    
        window.addEventListener('keydown', this.keydownHandler);
        this.loadLineheadSelection();
    }
    handleGoBackToWorldTree() {
        document.getElementById("game-holder")!.removeChild(this.game.renderer.domElement);
        document.getElementById('gameover-continue')!.removeEventListener('click', this.goBackToWorldTree);
        document.getElementById('gameover-container')!.style.display = 'none';
        document.getElementById('game-holder')!.style.display = 'none';
        // document.getElementById('tree-container')!.style.display = 'block';
        document.getElementById('apply-button')?.removeEventListener('click', () => {
            this.game.tags.status = 'begin';
            document.getElementById('character-container')!.style.display = 'none';
        });
        document.getElementsByClassName('IroColorPicker')[0].remove();
        window.removeEventListener('keydown', this.keydownHandler);
        this.game.dispose()
        location.reload();
    }
}

export{ MusicWorld };