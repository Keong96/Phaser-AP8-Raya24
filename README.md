# Raya24 Casino Games

A modern, browser-based casino game collection built with Phaser 3 and Vite, featuring engaging Hi-Lo card games and fast-paced Coin Flip mechanics.

## 🎮 Features

### 🃏 Hi-Lo Card Game
- **Strategic betting**: Predict higher or lower than the current card
- **Dynamic multipliers**: Odds adjust based on card values (1.06x to 12.75x)
- **Winning streaks**: Build momentum with consecutive correct predictions
- **Real-time betting**: Quick bet adjustments with intuitive controls
- **Smooth animations**: Card flip effects and visual feedback

### 🪙 Coin Flip Game
- **Simple mechanics**: Bet on heads or tails with 1.95x payout
- **Instant results**: Fast-paced gameplay with immediate outcomes
- **Streak tracking**: Visual history of recent wins and losses
- **Engaging effects**: Coin flip animations and celebration confetti

### 🛍️ Lucky Shop
- **Item collection**: Browse and purchase virtual items
- **Responsive grid**: Smooth scrolling interface with hover effects
- **Interactive UI**: Card-based displays with purchase buttons

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser with ES6 support

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/botahead/Phaser-AP8-Raya24.git
cd Phaser-AP8-Raya24

# Install dependencies
npm install

# Start development server
npm start
```

Open `http://localhost:5173` in your browser to play!

## 📁 Project Structure

```
├── src/
│   ├── main.js          # Phaser game configuration
│   └── GameScene.js     # Main game scene (Hi-Lo, Coin Flip, Shop)
├── public/
│   ├── assets/
│   │   ├── images/      # Game sprites and UI elements
│   │   │   ├── cards/   # Complete 52-card deck
│   │   │   └── ...      # Backgrounds, buttons, icons
│   │   ├── sounds/      # Audio effects and BGM
│   │   └── fonts/       # Custom typography
│   └── style.css        # Additional styling
├── index.html           # Game entry point
├── vite.config.js       # Build configuration
└── package.json         # Dependencies and scripts
```

## 🎯 Game Rules

### Hi-Lo Card Game
1. **Bet**: Place your wager and view the current card
2. **Predict**: Choose "Higher" or "Lower" for the next card
3. **Win**: Correct predictions multiply your bet by the displayed odds
4. **Streak**: Continue winning to build larger prize pools
5. **Cash Out**: Collect winnings anytime or risk losing them

**Card Multipliers:**
| Card | Higher | Lower |
|------|--------|-------|
| A    | 1.06x  | —     |
| 2    | 1.15x  | 12.75x|
| 3    | 1.27x  | 6.37x |
| ...  | ...    | ...   |
| K    | —      | 1.06x |

### Coin Flip
- **Bet**: Choose heads or tails
- **Fixed Odds**: 1.95x multiplier on correct guesses
- **Quick Play**: Instant results with streak tracking

## 🛠️ Tech Stack

- **Phaser 3.90.0**: Game engine for rendering and physics
- **Vite**: Fast development and build tooling
- **Canvas Confetti**: Victory celebration effects
- **ES6 Modules**: Modern JavaScript architecture
- **Responsive Design**: Mobile-first approach

## 🎨 Assets

### Visual
- Complete 52-card playing deck
- Custom UI elements and backgrounds
- Smooth animations and transitions
- Mobile-optimized layouts

### Audio
- Background music loop
- Interactive sound effects (clicks, wins, losses)
- Immersive audio experience

## 🎮 Controls

- **Mouse/Touch**: Click or tap to interact
- **Scroll**: Navigate shop items
- **Bet Controls**: Quick-select amounts or percentage bets

## 💰 Game Balance

- **Starting Balance**: $1,000
- **Bet Range**: Flexible amounts up to available balance
- **Fair Odds**: Mathematically balanced payout system

## 🔧 Development

### Available Scripts
```bash
npm start      # Development server
npm run build  # Production build
npm run preview # Preview production build
```

### Key Components
- **GameScene.js**: Main game logic (~1000+ lines)
  - Shop management and UI
  - Hi-Lo game mechanics
  - Coin flip implementation
  - Balance and betting systems