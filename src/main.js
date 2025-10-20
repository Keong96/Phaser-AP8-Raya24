const BOOT_PROGRESS_BASE = 0.2
let latestProgress = 0

const loadingOverlay = document.getElementById('loading-overlay')
const loadingMessage = document.getElementById('loading-message')
const loadingProgressBar = document.getElementById('loading-progress-bar')
const loadingProgressText = document.getElementById('loading-progress-text')

const setLoadingMessage = (text) => {
	if (loadingMessage) {
		loadingMessage.textContent = text
	}
}

const clampProgress = (value) => {
	if (Number.isNaN(value)) return 0
	return Math.min(1, Math.max(0, value))
}

const setLoadingProgress = (value, options = {}) => {
	const { force = false } = options
	const clamped = clampProgress(value)
	const next = force ? clamped : Math.max(clamped, latestProgress)
	latestProgress = next
	const percent = Math.round(next * 100)
	if (loadingProgressBar) {
		loadingProgressBar.style.width = `${percent}%`
	}
	if (loadingProgressText) {
		loadingProgressText.textContent = `${percent}%`
	}
}

const hideLoadingOverlay = () => {
	if (!loadingOverlay || loadingOverlay.classList.contains('is-hidden')) return
	requestAnimationFrame(() => {
		loadingOverlay.classList.add('is-hidden')
		loadingOverlay.addEventListener(
			'transitionend',
			() => {
				if (loadingOverlay && loadingOverlay.parentElement) {
					loadingOverlay.parentElement.removeChild(loadingOverlay)
				}
			},
			{ once: true }
		)
	})
}

const showLoadingError = (errorMessage) => {
	if (!loadingOverlay) return
	loadingOverlay.classList.remove('is-hidden')
	loadingOverlay.classList.add('has-error')
	setLoadingMessage(errorMessage)
}

const wireLoadingEvents = () => {
	if (typeof window === 'undefined') return
	window.addEventListener(
		'game:loading-progress',
		/** @param {CustomEvent<number>} event */ (event) => {
			const progress = typeof event.detail === 'number' ? event.detail : 0
			const normalized = BOOT_PROGRESS_BASE + progress * (1 - BOOT_PROGRESS_BASE)
			setLoadingProgress(normalized)
		}
	)
	window.addEventListener(
		'game:loading-message',
		/** @param {CustomEvent<string>} event */ (event) => {
			if (typeof event.detail === 'string' && event.detail.trim().length) {
				setLoadingMessage(event.detail)
			}
		}
	)
	window.addEventListener(
		'game:ready',
		() => {
			setLoadingMessage('Ready!')
			setLoadingProgress(1)
			hideLoadingOverlay()
		},
		{ once: true }
	)
}

const ensureInterFont = async () => {
	if (typeof document === 'undefined' || !document?.fonts?.load) return
	try {
		await Promise.all([
			document.fonts.load('16px "Inter"'),
			document.fonts.ready,
		])
	} catch (error) {
		console.warn('Inter font failed to preload', error)
	}
}

setLoadingProgress(0, { force: true })
wireLoadingEvents()

const bootstrap = async () => {
	setLoadingMessage('Loading...')
	setLoadingProgress(0.05)
	const [
		{ default: Phaser },
		{ default: confetti },
		{ default: GameScene },
	] = await Promise.all([
		import('phaser'),
		import('canvas-confetti'),
		import('./GameScene'),
	])

	setLoadingMessage('Setting the stage…')
	setLoadingProgress(0.15)
	await ensureInterFont()
	setLoadingMessage('Bringing in the Inter vibe…')
	setLoadingProgress(0.18)

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

	const game = new Phaser.Game(config)
	setLoadingMessage('Loading...')
	setLoadingProgress(BOOT_PROGRESS_BASE)
	return game
}

bootstrap()
	.catch((err) => {
		console.error('Failed to bootstrap the game', err)
		showLoadingError('Something went wrong while loading the casino. Please refresh to try again.')
	})
