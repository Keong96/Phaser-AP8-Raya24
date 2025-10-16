# Raya24 - Casino Games

A browser-based casino game collection built with Phaser 3, featuring Hi-Lo card games and Coin Flip gambling mechanics.

## 🎮 Game Features

### 🃏 Hi-Lo Card Game
- **Card-based gambling**: Predict if the next card will be higher or lower
- **Dynamic odds**: Payout multipliers change based on current card value
- **Streak system**: Build winning streaks with accumulating prize pools
- **Real-time betting**: Adjust bet amounts with quick-select buttons
- **Visual feedback**: Card flip animations and win/loss effects

### 🪙 Coin Flip Game
- **Simple coin toss**: Bet on heads or tails
- **1.95x multiplier**: Win almost double your bet on correct guesses
- **Streak tracking**: Visual history of wins and losses
- **Instant results**: Fast-paced gambling action

### 🛍️ Lucky Shop
- **Item showcase**: Scrollable grid of purchasable items
- **Interactive UI**: Card-based item display with buy buttons
- **Responsive design**: Smooth scrolling and hover effects

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- Local web server (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Phaser-AP8-Raya24
   ```

2. **Start a local server**
   ```bash
   # Using Node.js (with http-server)
   npx http-server
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

## 📁 Project Structure

```
Phaser-AP8-Raya24/
├── index.html          # Main HTML entry point
├── main.js             # Phaser configuration and scene setup
├── home.js             # Home/splash screen scene
├── game.js             # Main game scene with all game logic
├── fonts/              # Custom font files
│   ├── Brothers-Bold.ttf
│   └── Inter-Regular.ttf
├── images/             # Game assets
│   ├── cards/          # Playing card images (52 cards)
│   ├── background.png
│   ├── logo.png
│   └── [other game assets]
└── sounds/             # Audio files
    ├── background_music.mp3
    ├── click.mp3
    ├── win.mp3
    ├── lose.mp3
    └── ka-ching.mp3
```

## 🎯 Game Mechanics

### Hi-Lo Card Game Rules
1. **Starting**: Place a bet and see the current card
2. **Prediction**: Choose "Higher" or "Lower" for the next card
3. **Odds**: Multipliers range from 1.06x to 12.75x based on current card
4. **Winning**: Correct predictions multiply your bet by the shown odds
5. **Streaks**: Win up to 5 rounds in a row to maximize profits
6. **Cashout**: Collect your winnings anytime or risk losing it all

### Card Odds Table
| Card Rank | Higher Odds | Lower Odds |
|-----------|-------------|------------|
| Ace       | 1.06x       | —          |
| 2         | 1.15x       | 12.75x     |
| 3         | 1.27x       | 6.37x      |
| 4         | 1.42x       | 4.25x      |
| 5         | 1.60x       | 3.19x      |
| 6         | 1.82x       | 2.55x      |
| 7         | 2.13x       | 2.13x      |
| 8         | 2.55x       | 1.82x      |
| 9         | 3.19x       | 1.60x      |
| 10        | 4.25x       | 1.42x      |
| Jack      | 6.37x       | 1.27x      |
| Queen     | 12.75x      | 1.15x      |
| King      | —           | 1.06x      |

### Coin Flip Rules
1. **Simple betting**: Choose heads or tails
2. **Fixed odds**: 1.95x multiplier for correct guesses
3. **Instant results**: Coin flip animation reveals outcome
4. **Streak system**: Win up to 5 rounds consecutively

## 🎨 Technical Features

### Frontend Technologies
- **Phaser 3.55.2**: Game engine for rendering and physics
- **Canvas Confetti**: Celebration effects for wins
- **Custom Fonts**: Brothers-Bold and Inter for UI typography
- **ES6 Modules**: Modern JavaScript module system

### Game Architecture
- **Scene-based**: Separate scenes for home and main game
- **Responsive Design**: Scales to different screen sizes
- **Audio System**: Background music and sound effects
- **Animation System**: Smooth card flips and UI transitions

### Key Features
- **Real-time balance tracking**: Immediate bet deduction and winnings
- **Visual feedback**: Press effects, animations, and particle systems
- **Mobile support**: Touch-friendly controls and responsive layout
- **Accessibility**: Clear visual indicators and intuitive controls

## 🎵 Audio Assets

The game includes a complete audio experience:
- **Background Music**: Looping ambient casino music
- **Click Sounds**: UI interaction feedback
- **Win/Lose Sounds**: Outcome audio feedback
- **Special Effects**: Ka-ching sound for cashouts

## 🎨 Visual Assets

### Card System
- Complete 52-card deck with individual PNG files
- Consistent card back design
- Smooth flip animations with texture swapping

### UI Elements
- Custom button designs for betting actions
- Themed backgrounds and panels
- Visual history tracking with slot displays
- Responsive grid layouts for shop items

## 🔧 Development

### Code Structure
- **main.js**: Phaser configuration and scene management
- **home.js**: Splash screen with loading states
- **game.js**: Main game logic (1000+ lines)
  - Shop system with scrollable grid
  - Hi-Lo game with card mechanics
  - Coin flip game with probability systems
  - Shared UI components and utilities

### Key Classes and Methods
```javascript
// Main game scene
class GameScene extends Phaser.Scene {
  setupShop()     // Initialize shop interface
  setupHilo()     // Setup Hi-Lo card game
  setupCoinFlip() // Setup coin flip game
  
  // Utility methods
  addPressEffect()    // UI interaction feedback
  setUserBalance()    // Balance management
  revealCard()        // Card flip animations
}
```

## 🎮 Controls

### Desktop
- **Mouse**: Click to interact with all UI elements
- **Scroll Wheel**: Navigate shop items

### Mobile
- **Touch**: Tap to interact with buttons and games
- **Swipe**: Scroll through shop items

## 🏆 Game Balance

### Starting Conditions
- **Initial Balance**: $1,000.00
- **Minimum Bet**: No enforced minimum
- **Maximum Bet**: Limited by available balance

### Betting System
- **Quick Values**: $1, $5, $10, $50, $100
- **Percentage Bets**: 25%, 50%, 75%, 100% of balance
- **Reserve System**: Funds are reserved when betting

## 📈 Future Enhancements

Potential features for future development:
- **User Authentication**: Real user accounts and persistence
- **Leaderboards**: Competition and social features
- **More Games**: Additional casino game types
- **Progressive Jackpots**: Accumulating prize pools
- **Mobile App**: Native mobile application
- **Multiplayer**: Real-time gambling with other players

## 🐛 Known Issues

- API integration commented out in home.js (local development mode)
- Mobile orientation handling could be improved
- Audio unlock timing on some mobile browsers
