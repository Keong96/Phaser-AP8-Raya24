import confetti from 'canvas-confetti';
import StartGame from './game/main';

// Wait for fonts to load before starting Phaser with a timeout
const fontPromises = [
    document.fonts.load('16px Inter').catch(err => console.warn('Inter font failed:', err)),
    document.fonts.load('16px Brothers').catch(err => console.warn('Brothers font failed:', err))
];

const timeout = new Promise(resolve => setTimeout(resolve, 3000));

Promise.race([
    Promise.all(fontPromises),
    timeout
]).then(() => {
    console.log('Fonts ready (or timed out) — starting game');
    StartGame('phaser-container');
}).catch(err => {
    console.warn('Font load failed, starting anyway', err);
    StartGame('phaser-container');
});

// Make confetti available globally for the game
window.confetti = confetti;
