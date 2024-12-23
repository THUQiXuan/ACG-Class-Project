import { PlayerInfo } from "./WorldTree";
import { Howl } from "howler";

interface CustomWindow extends Window {
    auth: any;
    worldTree: any;
}

declare let window: CustomWindow;

class Auth {
    db: IDBDatabase;
    turnPage: Howl | null = null;
    click: Howl | null = null;

    constructor() {
        this.initDB(() =>{
            if (localStorage.getItem('username')) {
                this.login(localStorage.getItem('username')!, localStorage.getItem('password')!, async (result) => {
                    console.log("Logged in as", result.username);
                    await window.worldTree.setPlayer(result as any);
                    this.hideContainer('auth-background'); 
                    this.hideContainer('login-container');
                    this.showContainer('tree-container');
                    this.createButton();

                });
            }
            else {
                this.initializeAuthContainer();
            }
        });
    }
    private createButton() {
        this.click = new Howl({
            src: ['click.wav'],
            volume: 1,
        });
        const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            this.click?.play();
            location.reload();
        });
        const userManualButton = document.getElementById('user-manual-button') as HTMLButtonElement;
        userManualButton.addEventListener('click', () => {
            const userManualContainer = document.getElementById('user-manual-container') as HTMLElement;
            if (userManualContainer.style.display === 'block') {
                userManualContainer.style.display = 'none';
                userManualButton.textContent = 'User Manual'
            } else {
                userManualContainer.style.display = 'block';
                userManualButton.textContent = 'Close'

            }
            this.click?.play();
        });
    }
    private initDB(callback: () => void) {
        const request = indexedDB.open("GameDatabase", 1);
        request.onerror = (event: Event) => {
            console.error("Database error:", (event.target as IDBOpenDBRequest).error);
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            const objectStore = this.db.createObjectStore("users", { keyPath: "username" });
        };

        request.onsuccess = (event: Event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            callback();
        };
    }
    private initializeAuthContainer() {
        const startButton = document.querySelector('button#start-button') as HTMLButtonElement;
        startButton.addEventListener('click', () => {
            this.showContainer('login-container');
            this.hideContainer('welcome-container');
        });

        const loginButton = document.querySelector('button#login-button') as HTMLButtonElement;
        loginButton.addEventListener('click', () => {
            const username = (document.getElementById('login-username') as HTMLInputElement).value;
            const password = (document.getElementById('login-password') as HTMLInputElement).value;
            this.login(username, password, async (result) => {
                console.log("Logged in as", result.username, result.password, result.status);
                await window.worldTree.setPlayer(result as any);
                this.hideContainer('auth-background'); 
                this.hideContainer('login-container');
                this.showContainer('tree-container');
                this.createButton();
            });
        });
    
        const registerButton = document.querySelector('button#register-button') as HTMLButtonElement;
        registerButton.addEventListener('click', () => {
            const username = (document.getElementById('register-username') as HTMLInputElement).value;
            const password = (document.getElementById('register-password') as HTMLInputElement).value;
            this.register(username, password, () => {
                alert("Registration successful! Please log in.");
                this.showContainer('login-container');
                this.hideContainer('register-container');
            });
        });
    
        document.getElementById('switch-to-register')!.addEventListener('click', () => {
            this.showContainer('register-container');
            this.hideContainer('login-container');
        });
    
        document.getElementById('switch-to-login')!.addEventListener('click', () => {
            this.showContainer('login-container');
            this.hideContainer('register-container');
        });
    }

    public login(username: string, password: string, onSuccess: (playerInfo: any) => void) {
        const transaction = this.db.transaction(["users"], "readwrite");
        const objectStore = transaction.objectStore("users");

        const request = objectStore.get(username);
        request.onsuccess = () => {
            const result = request.result;
            if (result && result.password === password) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
                onSuccess(result);
            } else {
                alert("Login failed. Incorrect username or password.");
            }
        };
        request.onerror = () => {
            alert("Login failed. User not found.");
        };
    }

    public register(username: string, password: string, onSuccess: () => void) {
        const transaction = this.db.transaction(["users"], "readwrite");
        const objectStore = transaction.objectStore("users");
        const status = new Array(9).fill("locked");
        status[0] = "unlocked";
        const request = objectStore.add({ username, password, status });
        request.onsuccess = () => {
            onSuccess();
        };
        request.onerror = () => {
            alert("Registration failed. Username may already exist.");
        };
    }

    private showContainer(containerId: string) {
        document.getElementById(containerId)!.style.display = 'block';
    }
    private hideContainer(containerId: string) {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
            if (containerId === 'auth-background') {
                container.style.zIndex = '-1'; 
            }
        }
    }
    public writePlayerStatus(playerInfo: PlayerInfo) {
        const transaction = this.db.transaction(["users"], "readwrite");
        const objectStore = transaction.objectStore("users");
        // check if the record exists
        const getRequest = objectStore.get(playerInfo.username);
        // first delete the existing record, if the record exists
        const deleteRequest = objectStore.delete(playerInfo.username);
        deleteRequest.onsuccess = () => {
            console.log("Player status deleted.");
        };
        deleteRequest.onerror = () => {
            console.error("Player status delete failed.");
        };
        // then add the updated record
        const request = objectStore.add({ username: playerInfo.username, password: playerInfo.password, status: playerInfo.status });
        request.onsuccess = () => {
            console.log("Player status updated.");
        };
        request.onerror = () => {
            console.error("Player status update failed.");
        };
    }
}

export { Auth };