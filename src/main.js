const bootstrap = async () => {
	const [
		{ default: Phaser },
		{ default: confetti },
		{ default: GameScene },
	] = await Promise.all([
		import('phaser'),
		import('canvas-confetti'),
		import('./GameScene'),
	])

	// expose frequently used libraries to the game globals
	window.Phaser = Phaser
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

	return new Phaser.Game(config)
}

bootstrap().catch((err) => {
	console.error('Failed to bootstrap the game', err)
})
