import { MazeWorld } from "./MazeWorld/MazeWorld";
import { Roulette } from "./demo";
import { MusicWorld } from "./MusicWorld/MusicWorld";
import { Howl } from "howler";
import { gradeReverseMapping, gradeColorMapping } from "./gradeMapping";
export interface PlayerInfo {
    username: string;
    password: string;
    status: string[];
}
interface WorldTreeNode {
    name: string;
    id: number;
    children: number[];
    father: number[];
    game_type: string;
    num_dia: number;
}
interface CustomWindow extends Window {
    auth: any;
    worldTree: any;
}

declare let window: CustomWindow;

class WorldTree {
    container: HTMLElement;
    tree: WorldTreeNode[] = [];
    mazeWorld: MazeWorld | null = null;
    musicWorld: MusicWorld | null = null;
    currentPlayer: PlayerInfo | null = null;
    totalDia: number = 0
    turnPage: Howl | null = null;
    constructor() {
    }
    public async setPlayer(info: PlayerInfo) {
        this.currentPlayer = info;
        this.tree = await this.loadTree();
        this.container = document.getElementById('tree-container') as HTMLElement;
        this.renderTree();
    }

    private async loadTree(): Promise<WorldTreeNode[]> {
        const response = await fetch('database/game/worldTree.json');
        const tree = await response.json();
        return tree;
    }
    
    public renderTree() {
        window.auth.writePlayerStatus(this.currentPlayer);
        this.turnPage = new Howl({
            src: ['turn_page.wav'],
            volume: 1,
        });
        const slideshowSection = document.getElementsByClassName('slideshow')[0] as HTMLElement;
        slideshowSection.classList.add('slideshow');
        const rouletteContainer = document.getElementsByClassName('navigation')[0] as HTMLElement;
        const detailContainer = document.getElementsByClassName('detail')[0] as HTMLElement;
        let number = this.tree.length;
        for (let i = 0; i < number; i++) {
            const node = this.tree[i];
            const status = this.currentPlayer ? this.currentPlayer.status[i] : 'locked';
            const listItem = document.createElement('li');
            if (i != 0)
                listItem.classList.add('navigation-item');
            else
                listItem.classList.add('navigation-item', 'active');
            const rotateHolder = document.createElement('span');
            rotateHolder.classList.add('rotate-holder');
            listItem.appendChild(rotateHolder);
            const backgroundHolder = document.createElement('span');
            backgroundHolder.classList.add('background-holder');
            backgroundHolder.style.backgroundImage = `url(assets/img/img-${i + 1}.jpeg)`;
            if (status === 'locked') {
                backgroundHolder.style.filter = 'grayscale(100%)';
            }
            listItem.appendChild(backgroundHolder);
            rouletteContainer.appendChild(listItem);      

            const detailItem = document.createElement('div');
            if (i != 0)
                detailItem.classList.add('detail-item');
            else
                detailItem.classList.add('detail-item', 'active');
                detailContainer.appendChild(detailItem);
            const headline = document.createElement('div');
            headline.classList.add('headline');
            headline.innerText = node.name
            detailItem.appendChild(headline);

            const description = document.createElement('div');
            description.classList.add('description');
            description.innerHTML = 'State: ';


            if (status === 'locked') {
                const fathers = node.father.map((fatherId) => {
                    const fatherName = this.tree[fatherId].name;
                    return `<span class="father-name" data-father="${fatherId}" id="${this.tree[fatherId].name + node.name}" style="color: orange;">${fatherName}</span>`;
                }).join(' , ');
                description.innerHTML = `State: Sorry, you need to first complete [${fathers}] to unlock!`;

            } else if (status === 'unlocked') {
                description.innerHTML = description.innerText + ' Waiting for you to complete!';
            } else {
                description.innerHTML = description.innerText + ' Complete with grade <span style="color: ' + gradeColorMapping[status] + '">' + status + '</span>';
            }
            detailItem.appendChild(description);
            const background = document.createElement('div');
            background.classList.add('background');
            background.style.backgroundImage = 'url(assets/img/img-' + (i + 1) + '.jpeg)';
            if (status === 'locked') {
                background.style.filter = 'grayscale(100%)';
            }
            detailItem.appendChild(background);
            detailContainer.appendChild(detailItem);
        }
        Roulette(this.turnPage)
        var ndia = 0
        var nlevel = 0
        for(let i = 0; i < this.tree.length; ++i) {
            this.totalDia += this.tree[i].num_dia
            if(!this.currentPlayer?.status[i].endsWith('locked')) {
                nlevel += 1
                ndia += this.tree[i].num_dia - gradeReverseMapping[this.currentPlayer?.status[i]!]
            }
        }

        const userStats = document.getElementById('user-stats') as HTMLElement
        const usernameSpan = document.createElement('span');
        usernameSpan.id = 'username';
        usernameSpan.textContent = this.currentPlayer?.username!
        const diamondCountSpan = document.createElement('span');
        diamondCountSpan.id = 'diamond-count';
        diamondCountSpan.textContent = ndia + ' / ' + this.totalDia;
        const levelCountSpan = document.createElement('span');
        levelCountSpan.id = 'level-count';
        levelCountSpan.textContent = nlevel + ' / ' + this.tree.length;
        const levelMessage = document.createElement('p');
        levelMessage.innerHTML = 'Levels: ';
        levelMessage.appendChild(levelCountSpan);
        userStats.insertBefore(levelMessage, userStats.firstChild)

        const diamondMessage = document.createElement('p');
        diamondMessage.innerHTML = 'Diamonds: ';
        diamondMessage.appendChild(diamondCountSpan);
        userStats.insertBefore(diamondMessage, userStats.firstChild)

        const welcomeMessage = document.createElement('h2');
        welcomeMessage.innerHTML = 'Welcome, ';
        welcomeMessage.appendChild(usernameSpan);
        userStats.insertBefore(welcomeMessage, userStats.firstChild)
    
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const activeItem = rouletteContainer.querySelector('.navigation-item.active');
                if (activeItem) {
                    if (this.currentPlayer!.status[Array.from(rouletteContainer.children).indexOf(activeItem)] === 'locked') {
                        alert("This world is locked. Please complete the previous world first.");
                        return;
                    }
                    const index = Array.from(rouletteContainer.children).indexOf(activeItem);
                    this.initializeWorld(index);
                    document.removeEventListener('keydown', handleKeyDown);
                    while(this.container.firstChild) {
                        this.container.removeChild(this.container.firstChild);
                    }
                    document.getElementById('tree-container')!.style.display = 'none';
                    document.getElementById('game-holder')!.style.display = 'block';
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }
    public async initializeWorld(worldId: number) {
        if (this.tree[worldId].game_type === 'music') {
            if (!this.musicWorld) {
                this.musicWorld = new MusicWorld();
            }
            await this.musicWorld!.init(worldId);
        } else {
            this.mazeWorld = new MazeWorld();
            await this.mazeWorld!.init(worldId);
            this.mazeWorld!.start();
        }
    }
}

export { WorldTree };