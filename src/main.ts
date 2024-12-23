// FILE: main.ts
import { Auth } from './Auth';
import { init } from './MusicWorld/functions/gameInit';
import { WorldTree } from './WorldTree';

interface CustomWindow extends Window {
    auth: any;
    worldTree: any;
}

declare let window: CustomWindow;

function initialize(a:string, b:string, c:string, d:string, e:string) {
    document.getElementById('login-container')!.style.display = a
    document.getElementById('register-container')!.style.display = b
    document.getElementById('tree-container')!.style.display = c
    document.getElementById('game-holder')!.style.display = d
    document.getElementById('welcome-container')!.style.display = e
}

if (localStorage.getItem('username')) {
    initialize('none', 'none', 'block', 'none', 'none');

    window.worldTree = new WorldTree();
    window.auth = new Auth();
}
else {
    initialize('none', 'none', 'none', 'none', 'block');
    window.worldTree = new WorldTree();
    window.auth = new Auth();
}

