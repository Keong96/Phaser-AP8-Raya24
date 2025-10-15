import HomeScene from './home.js';
import GameScene from './game.js';

const isMobile = /mobile/i.test(navigator.userAgent);

export const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
    orientation: 'landscape'
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