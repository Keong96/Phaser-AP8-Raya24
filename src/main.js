import Phaser from 'phaser'
import confetti from 'canvas-confetti'

import GameScene from './GameScene'

// Make confetti available globally for the game
window.confetti = confetti

const config = {
	type: Phaser.AUTO,
	parent: 'game-container',
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 1080,
		height: 1920,
		orientation: Phaser.Scale.Orientation.PORTRAIT,
	},
	scene: [GameScene],
}

export default new Phaser.Game(config)
