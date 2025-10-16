import { AUTO, Game, Scale } from 'phaser';
import HomeScene from './scenes/HomeScene';
import GameScene from './scenes/GameScene';

const isMobile = /mobile/i.test(navigator.userAgent);

const config = {
    type: AUTO,
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH,
        fullscreenTarget: 'phaser-container',
        parent: 'phaser-container',
        width: window.innerWidth,
        height: window.innerHeight
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800, debug: false },
            debug: false
        }
    },
    scene: [HomeScene, GameScene],
    audio: {
        disableWebAudio: true
    },
    dom: {
        createContainer: true
    },
    parent: 'phaser-container'
};

const StartGame = (parent) => {
    const game = new Game({ ...config, parent });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth, window.innerHeight);
    });
    
    return game;
}

export default StartGame;
