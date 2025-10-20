import Phaser from 'phaser'

let currency = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumIntegerDigits: 1,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  supportsWebP() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => resolve(img.complete && img.width > 0);
      img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
    });
  }

  init(data) {
    this.balance = data.balance ?? 1000;
  }

  preload() {
    if (typeof window !== 'undefined') {
      this.load.on('progress', (value) => {
        window.dispatchEvent(new CustomEvent('game:loading-progress', { detail: value }));
      });

      this.load.once('complete', () => {
        window.dispatchEvent(new CustomEvent('game:loading-message', { detail: 'Opening the casino floor…' }));
        window.dispatchEvent(new CustomEvent('game:loading-progress', { detail: 1 }));
      });
    }

    const ext = this.supportsWebP() ? 'webp' : 'png'
    this.load.image('background', 'assets/images/background.png');
    const panelBgPath = ext === 'webp' ? 'assets/images/bg.webp' : 'assets/images/background2.png';
    this.load.image('panelBg', panelBgPath);
    this.load.image('item', 'assets/images/item.png');

    const suits = ["diamonds", "clubs", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    suits.forEach(suit => ranks.forEach(rank => {
      this.load.image(`${rank}_of_${suit}`, `assets/images/cards/${rank}_of_${suit}.png`);
    }));

    this.load.image('portrait', 'assets/images/portrait.png');
    this.load.image('deposit', `assets/images/deposit.${ext}`);

    this.load.image('lucky_shop', 'assets/images/lucky_shop.png');
    this.load.image('hilo_game', `assets/images/hilo_game.${ext}`);
    this.load.image('coinflip_game', `assets/images/coinflip_game.${ext}`);

    this.load.image('safe_icon', `assets/images/safe_icon.${ext}`);
    this.load.image('help_icon', `assets/images/help_icon.${ext}`);
    this.load.image('music_icon', `assets/images/music_icon.${ext}`);

    this.load.image('info_icon', `assets/images/info_icon.png`);

    this.load.image('shadow', 'assets/images/shadow.png');
    this.load.image('card_back', 'assets/images/card_back.png');
    this.load.image('up_arrow', 'assets/images/up_arrow.png');
    this.load.image('down_arrow', 'assets/images/down_arrow.png');
    this.load.image('bet_higher', 'assets/images/bet_higher.png');
    this.load.image('bet_lower', 'assets/images/bet_lower.png');
    this.load.image('bet_head', 'assets/images/bet_head.png');
    this.load.image('bet_tail', 'assets/images/bet_tail.png');

    this.load.image('bet_value_bg', 'assets/images/bet_value_bg.png');
    this.load.image('minus_button', 'assets/images/minus_button.png');
    this.load.image('plus_button', 'assets/images/plus_button.png');
    this.load.image('cashout_button', 'assets/images/cashout_button.png');

    this.load.image('coin_head', 'assets/images/coin_head.png');
    this.load.image('coin_tail', 'assets/images/coin_tail.png');

    this.load.image('history_slot', 'assets/images/history_slot.png');

    // Sound effects
    this.load.audio('bgm', 'assets/sounds/background_music.mp3');
    this.load.audio('click', 'assets/sounds/click.mp3');
    this.load.audio('winSound', 'assets/sounds/win.mp3');
    this.load.audio('loseSound', 'assets/sounds/lose.mp3');
    this.load.audio('ka-chingSound', 'assets/sounds/ka-ching.mp3');
    this.load.image('cashout_button', 'assets/images/cashout_button.png');
  }

  create() {
    const confettiCanvas = document.getElementById('confetti');
    if (confettiCanvas instanceof HTMLCanvasElement && window.confetti) {
      this.myConfetti = window.confetti.create(confettiCanvas, {
        resize: true,
        useWorker: true
      });
    } else {
      console.warn('Confetti canvas not found or confetti not loaded');
      this.myConfetti = null;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // play bgm safely
    this.sound.unlock();
    this.bgm = this.sound.add('bgm', { loop: true });
    this.musicOn = true;
    if (!this.sound.locked) {
      this.bgm.play();
    } else {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => { this.bgm.play(); });
    }

    // background full screen
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    // Content column size (portrait) - scale based on screen height
    const baseContentWidth = 1080;
    const baseContentHeight = 1920;
    const heightScale = height / baseContentHeight;
    this.contentWidth = baseContentWidth;
    this.contentHeight = height;
    this.headerHeight = 140;

    // center content column horizontally
    const contentX = Math.round((width - this.contentWidth) / 2);

    // containers (positioned at contentX so children use same local coords)
    // Start below the header
    this.shopContainer = this.add.container(contentX, this.headerHeight).setVisible(false);
    this.hiloContainer = this.add.container(contentX, this.headerHeight).setVisible(true);
    this.coinFlipContainer = this.add.container(contentX, this.headerHeight).setVisible(false);

    // build screens
    // this.setupShop();
    this.setupHilo();
    this.setupCoinFlip();

    this.createHeader();
    this.createGameNavButtons();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game:loading-message', { detail: 'Welcome to the lucky lobby!' }));
      window.dispatchEvent(new Event('game:ready'));
    }
  }

  addPressEffect(obj, pairedText = null, offset = 5) {
    obj.originalY = obj.y;
    if (pairedText && pairedText.originalY === undefined) pairedText.originalY = pairedText.y;

    obj.on('pointerdown', () => {
      obj.y = obj.originalY + offset;
      if (pairedText) pairedText.y = pairedText.originalY + offset;

      if (this.sound) {
        const clickSound = this.sound.get('click');
        if (clickSound) clickSound.stop();
        this.sound.play('click');
      }
    });

    const reset = () => {
      obj.y = obj.originalY;
      if (pairedText) pairedText.y = pairedText.originalY;
    };

    obj.on('pointerup', reset);
    obj.on('pointerout', reset);
  }

  createSettingButtons(x, y, size = 80) {
    const spacing = 100;
    const buttons = [];

    const safeBtn = this.add.image(x, y, 'safe_icon')
      .setOrigin(0.5)
      .setDisplaySize(size, size)
      .setInteractive({ useHandCursor: true });
    safeBtn.on('pointerdown', () => {
      this.handleSafeClick();
    });
    this.addPressEffect(safeBtn);
    buttons.push(safeBtn);

    const helpBtn = this.add.image(x + spacing, y, 'help_icon')
      .setOrigin(0.5)
      .setDisplaySize(size, size)
      .setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      this.showHelpPopup();
    });
    this.addPressEffect(helpBtn);
    buttons.push(helpBtn);

    const musicBtn = this.add.image(x + spacing * 2, y, 'music_icon')
      .setOrigin(0.5)
      .setDisplaySize(size, size)
      .setInteractive({ useHandCursor: true });
    musicBtn.on('pointerdown', () => {
      this.toggleMusic();
    });
    this.addPressEffect(musicBtn);
    buttons.push(musicBtn);

    return buttons;
  }

  createHeader() {
    const panelWidth = this.contentWidth;
    const headerHeight = 140;

    // create header container
    this.headerContainer = this.add.container(0, 0);

    // white background for header
    const headerBg = this.add.rectangle(0, 0, this.cameras.main.width, headerHeight, 0xFFFFFF, 1)
      .setOrigin(0, 0);
    this.headerContainer.add(headerBg);

    const startX = (this.cameras.main.width - panelWidth) / 2;
    const startY = 0;

    // portrait
    const portrait = this.add.image(startX + 190, startY + 75, 'portrait')
      .setDisplaySize(120, 120)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // user info (username + token)
    const usernameText = this.add.text(startX + 290, startY + 55, 'Donald Trump', {
      font: '40px Inter',
      color: '#B68B82',
      align: 'left'
    }).setOrigin(0, 0.5);

    this.tokenText = this.add.text(startX + 290, startY + 100, 'Token: 12345 coins', {
      font: '32px Inter',
      color: '#B68B82',
      align: 'left'
    }).setOrigin(0, 0.5);

    // deposit button
    const depositBtn = this.add.image(startX + panelWidth - 200, startY + 70, 'deposit')
      .setDisplaySize(170, 80)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.openDepositModal();
      });

    this.addPressEffect(depositBtn, null, 4);
    this.headerContainer.add([portrait, usernameText, this.tokenText, depositBtn]);

    // Set header to highest depth so it stays on top
    this.headerContainer.setDepth(1000);
  }

  createGameNavButtons() {
    const width = this.cameras.main.width;
    const panelWidth = this.contentWidth;
    const startX = this.cameras.main.width;

    // Create nav container on the right side
    this.navContainer = this.add.container(0, 0);
    this.add.existing(this.navContainer);

    // --- Game Nav Buttons (Vertical) ---
    const buttons = ['lucky_shop', 'hilo_game', 'coinflip_game'];
    const containers = [this.shopContainer, this.hiloContainer, this.coinFlipContainer];
    const spacingY = 150;
    const btnX = panelWidth - 190; // Position to the right of content
    const btnStartY = 220;

    buttons.forEach((key, i) => {
      const cy = btnStartY + i * spacingY;

      const btn = this.add.image(btnX, cy, key)
        .setDisplaySize(120, 120)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          containers.forEach((c, idx) => c.setVisible(idx === i));
          this.setUserBalance(this.userBalance);
        });

      this.addPressEffect(btn, null, 4);
      this.navContainer.add(btn);
    });

    // Set nav to high depth so it stays visible
    this.navContainer.setDepth(999);
  }

  openDepositModal() {

  }

  setUserBalance(amount) {
    const v = Number(amount) || 0;
    this.userBalance = parseFloat(v.toFixed(2));
    const txt = `Balance: ${currency.format(this.userBalance)} coins`;
    if (this.hilo && this.hilo.balanceText) this.hilo.balanceText.setText(txt);
    if (this.coinFlip && this.coinFlip.balanceText) this.coinFlip.balanceText.setText(txt);
  }

  //   setupShop() {
  //     const panelWidth = this.contentWidth;
  //     const panelHeight = this.contentHeight;
  //     const startX = 20;
  //     const startY = 20;

  //     // background panel (light but slightly visible)
  //     const bg = this.add.image(startX, startY, 'panelBg').setOrigin(0).setDisplaySize(panelWidth - 40, panelHeight - 40);
  //     this.shopContainer.add(bg);

  //     const scrollAreaHeight = panelHeight - 80;

  //     // Use add.graphics() (must be in display list) for geometry mask
  //     const maskGraphics = this.add.graphics();
  //     maskGraphics.fillStyle(0xffffff, 1);
  //     maskGraphics.fillRect(startX + 10, startY + 10, panelWidth - 60, scrollAreaHeight);
  //     // Hide the graphics itself so it doesn't show on screen
  //     maskGraphics.setVisible(false);

  //     const mask = maskGraphics.createGeometryMask();

  //     // Scrollable content container (center aligned inside panel area)
  //     const content = this.add.container(startX + panelWidth / 2, startY + scrollAreaHeight / 2);
  //     content.setMask(mask);
  //     this.shopContainer.add(content);

  //     // Grid setup
  //     const cols = 3;
  //     const rows = 3;
  //     const itemSize = 150;
  //     const spacing = 30;

  //     for (let i = 0; i < cols * rows; i++) {
  //       const col = i % cols;
  //       const row = Math.floor(i / cols);

  //       const x = (col - (cols - 1) / 2) * (itemSize + spacing);
  //       const y = (row - (rows - 1) / 2) * (itemSize + spacing);

  //       const itemContainer = this.add.container(x, y);

  //       // Card-like background for each item (higher contrast)
  //       const box = this.add.rectangle(0, 0, itemSize, itemSize, 0xf2f2f2)
  //         .setOrigin(0.5)
  //         .setStrokeStyle(2, 0x222222);
  //       itemContainer.add(box);

  //       // Item image (use single key 'item' for fallback)
  //       const imgKey = `item${i + 1}`;
  //       const img = this.textures.exists(imgKey) ? this.add.image(0, -20, imgKey) : this.add.image(0, -20, 'item');
  //       img.setDisplaySize(80, 80).setOrigin(0.5);
  //       itemContainer.add(img);

  //       // Item name
  //       const name = this.add.text(0, 30, `Item ${i + 1}`, {
  //         font: "16px Inter",
  //         color: "#111111",
  //         align: "center"
  //       }).setOrigin(0.5);
  //       itemContainer.add(name);

  //       // Price
  //       const price = this.add.text(0, 50, `$${(i + 1) * 10}`, {
  //         font: "14px Inter",
  //         color: "#008800"
  //       }).setOrigin(0.5);
  //       itemContainer.add(price);

  //       // Buy button
  //       const btnHeight = 32;
  //       const paddingBottom = 5;
  //       const btnY = itemSize / 2 - (btnHeight / 2) - paddingBottom;
  //       const buyBtnBg = this.add.rectangle(0, btnY, itemSize - 12, btnHeight, 0x4444aa)
  //         .setOrigin(0.5)
  //         .setInteractive({ useHandCursor: true });
  //       const buyBtnText = this.add.text(0, btnY, "Buy", {
  //         font: "14px Inter",
  //         color: "#fff"
  //       }).setOrigin(0.5);

  //       buyBtnBg.on("pointerdown", () => {
  //         console.log(`Purchased Item ${i + 1}`);
  //         // hook purchase logic here
  //       });

  //       itemContainer.add(buyBtnBg);
  //       itemContainer.add(buyBtnText);

  //       content.add(itemContainer);
  //     }

  //     // Scroll with mouse wheel (only when shopContainer visible)
  //     this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
  //       if (!this.shopContainer.visible) return;
  //       content.y -= deltaY * 0.5;
  //       // clamp scroll so content won't scroll infinitely (optional)
  //       const maxScroll = (itemSize + spacing) * (rows / 2);
  //       const minY = startY + scrollAreaHeight / 2 - maxScroll;
  //       const maxY = startY + scrollAreaHeight / 2 + maxScroll;
  //       content.y = Phaser.Math.Clamp(content.y, minY, maxY);
  //     });
  //   }

  setupHilo() {
    const panelWidth = this.contentWidth;
    const betPanelHeight = 600;
    const panelHeight = this.contentHeight - this.headerHeight - betPanelHeight;
    const startX = 0;
    const startY = 0;

    // panel background
    const bg = this.add.image(startX, startY, 'panelBg').setOrigin(0).setDisplaySize(panelWidth, panelHeight);
    this.hiloContainer.add(bg);

    // inner area
    const contentLeft = startX + 20;
    const contentTop = startY + 20;
    const contentW = panelWidth;
    const contentH = panelHeight;
    const centerX = contentLeft + contentW / 2;
    const centerY = contentTop + contentH / 2 + 150;

    const settingButtons = this.createSettingButtons(startX + 160, startY + 60);
    this.hiloContainer.add(settingButtons);

    // helper for card keys
    const suits = ["diamonds", "clubs", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    const indexToKey = (index) => {
      const suit = suits[Math.floor(index / 13)];
      const rank = ranks[index % 13];
      return `${rank}_of_${suit}`;
    };
    const getRandomIndex = () => Math.floor(Math.random() * 52);

    // odds table
    const cardRatios = [
      { higher: 1.06, lower: null },
      { higher: 1.15, lower: 12.75 },
      { higher: 1.27, lower: 6.37 },
      { higher: 1.42, lower: 4.25 },
      { higher: 1.60, lower: 3.19 },
      { higher: 1.82, lower: 2.55 },
      { higher: 2.13, lower: 2.13 },
      { higher: 2.55, lower: 1.82 },
      { higher: 3.19, lower: 1.60 },
      { higher: 4.25, lower: 1.42 },
      { higher: 6.37, lower: 1.27 },
      { higher: 12.75, lower: 1.15 },
      { higher: null, lower: 1.06 }
    ];
    const getRank = (index) => index % 13;

    // === Card (start random) ===
    let currentIndex = getRandomIndex();
    const cardKey = indexToKey(currentIndex);
    const card = this.add.image(centerX, centerY - 200, cardKey).setOrigin(0.5);
    this.hiloContainer.add(card);

    // force card display size (keep ratio)
    const CARD_W = 144 * 2, CARD_H = 191 * 2;
    const tex = this.textures.get(cardKey);
    const baseWidth = (tex && tex.source && tex.source[0]) ? tex.source[0].width : card.width || CARD_W;
    const baseHeight = (tex && tex.source && tex.source[0]) ? tex.source[0].height : card.height || CARD_H;
    card.setScale(CARD_W / baseWidth, CARD_H / baseHeight);

    const shadow = this.add.image(centerX, centerY + 100, 'shadow')
      .setOrigin(0.5)
      .setDisplaySize(344, 60);
    this.hiloContainer.add(shadow);

    // arrows + rate texts
    const arrowOffsetX = Math.min(280, contentW * 0.5);
    const arrowY = centerY - 180;

    const leftArrowImg = this.add.image(centerX - arrowOffsetX, arrowY, 'down_arrow').setDisplaySize(128, 80).setOrigin(0.5);
    const leftRateText = this.add.text(centerX - arrowOffsetX, arrowY - 80, '—', { font: "35px Inter", color: "#000000", align: 'center' }).setOrigin(0.5);
    const leftInfoText = this.add.text(centerX - arrowOffsetX, arrowY + 90, 'Lower\nOr Same', { font: "35px Inter", color: "#000000", align: 'center' }).setOrigin(0.5);
    this.hiloContainer.add([leftArrowImg, leftRateText, leftInfoText]);

    const rightArrowImg = this.add.image(centerX + arrowOffsetX, arrowY, 'up_arrow').setDisplaySize(128, 80).setOrigin(0.5);
    const rightRateText = this.add.text(centerX + arrowOffsetX, arrowY - 80, '—', { font: "35px Inter", color: "#000000", align: 'center' }).setOrigin(0.5);
    const rightInfoText = this.add.text(centerX + arrowOffsetX, arrowY + 90, 'Higher\nOr Same', { font: "35px Inter", color: "#000000", align: 'center' }).setOrigin(0.5);
    this.hiloContainer.add([rightArrowImg, rightRateText, rightInfoText]);

    const updateRates = (index) => {
      const rank = getRank(index);
      const ratio = cardRatios[rank];
      if (ratio.lower) {
        leftRateText.setText(ratio.lower.toFixed(2) + "x"); leftRateText.setAlpha(1);
      } else { leftRateText.setText("—"); leftRateText.setAlpha(0.5); }
      if (ratio.higher) {
        rightRateText.setText(ratio.higher.toFixed(2) + "x"); rightRateText.setAlpha(1);
      } else { rightRateText.setText("—"); rightRateText.setAlpha(0.5); }
    };
    updateRates(currentIndex);

    // === Bet panel ===
    // Create betPanel container at the bottom
    const betPanelContainer = this.add.container(0, panelHeight);
    this.hiloContainer.add(betPanelContainer);

    const betPanelX = contentLeft + contentW / 2 - 10;
    const betPanelY = betPanelHeight / 2;

    const slotSpacing = 170;
    this.hiloHistorySlot = [];

    for (let i = 0; i < 5; i++) {
      let slot = this.add.image(betPanelX + 3 + (i - 2) * slotSpacing, betPanelY - 440, 'history_slot')
        .setDisplaySize(150, 150)
        .setOrigin(0.5);
      this.hiloHistorySlot.push(slot);
    }

    betPanelContainer.add(this.hiloHistorySlot);

    const betBg = this.add.rectangle(betPanelX, betPanelY, contentW, betPanelHeight, 0xFFFFFF, 0.95)
      .setOrigin(0.5).setStrokeStyle(2, 0x888888, 0.3);
    betPanelContainer.add(betBg);

    // floating panel
    const floatingPanelWidth = contentW - 250;
    const floatingPanelHeight = 500;
    const floatingPanelY = betPanelY - betPanelHeight / 2 + 300;
    const floatingPanelRadius = 20;

    // soft shadow layers
    const shadowLayers = [
      { offsetY: 5, blur: 6, alpha: 0.03 },
      { offsetY: 5, blur: 3, alpha: 0.04 },
      { offsetY: 5, blur: 1.5, alpha: 0.03 }
    ];

    shadowLayers.forEach(layer => {
      const shadowGraphics = this.add.graphics();
      shadowGraphics.fillStyle(0x000000, layer.alpha);
      shadowGraphics.fillRoundedRect(
        betPanelX - floatingPanelWidth / 2 - layer.blur,
        floatingPanelY - floatingPanelHeight / 2 + layer.offsetY - layer.blur,
        floatingPanelWidth + (layer.blur * 2),
        floatingPanelHeight + (layer.blur * 2),
        floatingPanelRadius + layer.blur
      );
      betPanelContainer.add(shadowGraphics);
    });

    const floatingPanelGraphics = this.add.graphics();
    floatingPanelGraphics.fillStyle(0xffffff, 1);
    floatingPanelGraphics.fillRoundedRect(
      betPanelX - floatingPanelWidth / 2,
      floatingPanelY - floatingPanelHeight / 2,
      floatingPanelWidth,
      floatingPanelHeight,
      floatingPanelRadius
    );
    floatingPanelGraphics.lineStyle(2, 0xe0e0e0, 1);
    floatingPanelGraphics.strokeRoundedRect(
      betPanelX - floatingPanelWidth / 2,
      floatingPanelY - floatingPanelHeight / 2,
      floatingPanelWidth,
      floatingPanelHeight,
      floatingPanelRadius
    );
    betPanelContainer.add(floatingPanelGraphics);

    // balance text (local to hilo screen)
    this.userBalance = (typeof this.userBalance === 'number') ? this.userBalance : (typeof this.balance === 'number' ? this.balance : 1000);
    const balanceText = this.add.text(betPanelX - 400, betPanelY - 200, `Balance: ${currency.format(this.userBalance)} coins`, {
      font: "48px Inter", color: '#000000', align: 'left'
    }).setOrigin(0, 0.5);
    betPanelContainer.add(balanceText);

    const infoIcon = this.add.image(betPanelX + 375, betPanelY - 200, 'info_icon')
      .setOrigin(0.5).setDisplaySize(48, 48).setInteractive({ useHandCursor: true });
    betPanelContainer.add(infoIcon);

    // expose ref for sync
    this.hilo = this.hilo || {};
    this.hilo.balanceText = balanceText;

    // Fixed bet amount - always 10 tokens per play
    this.hiloBetAmount = 10.00;

    // Higher / Lower buttons - create BEFORE revealCard (revealCard uses these refs)
    const upBtnImg = this.add.image(betPanelX + 220, betPanelY - 50, 'bet_higher')
      .setOrigin(0.5).setDisplaySize(360, 170).setInteractive({ useHandCursor: true });
    this.addPressEffect(upBtnImg);

    const downBtnImg = this.add.image(betPanelX - 220, betPanelY - 50, 'bet_lower')
      .setOrigin(0.5).setDisplaySize(360, 170).setInteractive({ useHandCursor: true });
    this.addPressEffect(downBtnImg);

    const infoTextIcon = this.add.image(betPanelX - 200, betPanelY + 225, 'info_icon')
      .setOrigin(0.5).setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
    betPanelContainer.add(infoTextIcon);

    const infoText = this.add.text(betPanelX - 164, betPanelY + 225, `Betting 1 time with 10 coins.`, {
      font: "24px Inter", color: '#636363', align: 'left'
    }).setOrigin(0, 0.5);
    betPanelContainer.add(infoText);

    // prize pool & cashout
    this.prizePool = 0.00;
    const cashoutBg = this.add.image(betPanelX, betPanelY + 135, 'cashout_button')
      .setOrigin(0.5)
      .setDisplaySize(720, 100)
      .setInteractive();
    const cashoutText = this.add.text(cashoutBg.x, cashoutBg.y, "CASHOUT", { font: "48px Inter", color: '#fff' }).setOrigin(0.5);
    this.addPressEffect(cashoutBg, cashoutText);
    this.cashoutEnabled = false;

    this.updateCashoutButton = () => {
      if (this.prizePool > 0) {
        cashoutText.setText(`CASHOUT $${currency.format(this.prizePool)}`);
        cashoutText.setColor('#fff');
        this.cashoutEnabled = true;
        cashoutBg.setInteractive({ useHandCursor: true });
      } else {
        cashoutText.setText("CASHOUT");
        cashoutText.setColor('#FFF');
        this.cashoutEnabled = false;
        cashoutBg.disableInteractive();
      }
    };

    cashoutBg.on('pointerdown', () => {
      if (!this.cashoutEnabled) return;

      // add prizePool to balance
      this.setUserBalance(this.userBalance + this.prizePool);
      balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);

      // play sound
      if (!this.sound.locked) {
        this.sound.play('ka-chingSound', { volume: 1 });
      } else {
        this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.sound.play('ka-chingSound', { volume: 1 });
        });
      }

      this.prizePool = 0;
      this.updateCashoutButton();

      // clear all history slots
      this.hiloHistorySlot.forEach(slot => {
        if (slot.cardImage) {
          slot.cardImage.destroy();
          slot.cardImage = null;
        }
      });

      // reset game state
      this.hiloGameStarted = false;
    });

    this.updateCashoutButton();
    betPanelContainer.add([upBtnImg, downBtnImg, cashoutBg, cashoutText]);

    // revealCard: uses up/down btn refs, disables them while flipping
    this.isFlipping = false;
    const getScalesForKey = (key) => {
      const texK = this.textures.get(key);
      let frameW = CARD_W, frameH = CARD_H;
      if (texK && texK.source && texK.source[0]) {
        frameW = texK.source[0].width; frameH = texK.source[0].height;
      } else if (card.frame) {
        frameW = card.frame.width; frameH = card.frame.height;
      }
      return { sx: CARD_W / frameW, sy: CARD_H / frameH };
    };

    const revealCard = (newIndex, onComplete = null) => {
      if (this.isFlipping) return;
      this.isFlipping = true;

      // disable H/L while flipping
      upBtnImg.disableInteractive().setAlpha(0.5);
      downBtnImg.disableInteractive().setAlpha(0.5);

      this.tweens.killTweensOf(card);
      // shrink horizontally to 0
      this.tweens.add({
        targets: card,
        scaleX: 0,
        duration: 160,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          // show card back first (scale Y preserved)
          const backKey = 'card_back';
          const backScales = getScalesForKey(backKey);
          card.setTexture(backKey);
          card.setScale(0, backScales.sy);

          // expand to show back
          this.tweens.add({
            targets: card,
            scaleX: backScales.sx,
            duration: 160,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              // small delay to show back
              this.time.delayedCall(160, () => {
                // flip to front
                this.tweens.add({
                  targets: card,
                  scaleX: 0,
                  duration: 160,
                  ease: 'Cubic.easeIn',
                  onComplete: () => {
                    const finalKey = indexToKey(newIndex);
                    const finalScales = getScalesForKey(finalKey);
                    card.setTexture(finalKey);
                    card.setScale(0, finalScales.sy);

                    this.tweens.add({
                      targets: card,
                      scaleX: finalScales.sx,
                      duration: 160,
                      ease: 'Cubic.easeOut',
                      onComplete: () => {
                        this.isFlipping = false;
                        upBtnImg.setInteractive({ useHandCursor: true }).setAlpha(1);
                        downBtnImg.setInteractive({ useHandCursor: true }).setAlpha(1);
                        currentIndex = newIndex;
                        if (typeof onComplete === 'function') onComplete();
                      }
                    });
                  }
                });
              });
            }
          });
        }
      });
    };

    this.hiloGameStarted = false;
    const startRound = (isHigher) => {
      // Check if user has enough balance
      if (this.userBalance < this.hiloBetAmount) return;

      // Deduct bet from balance
      this.setUserBalance(this.userBalance - this.hiloBetAmount);
      balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);

      if (!this.hiloGameStarted) {
        this.hiloGameStarted = true;
      }

      const currentRank = getRank(currentIndex);
      let nextIndex = getRandomIndex();
      while (nextIndex === currentIndex && 52 > 1) nextIndex = getRandomIndex();
      const nextRank = getRank(nextIndex);

      const userWin = (isHigher && nextRank >= currentRank) || (!isHigher && nextRank <= currentRank);
      const chosenRatio = isHigher ? cardRatios[currentRank].higher : cardRatios[currentRank].lower;

      revealCard(nextIndex, () => {
        updateRates(currentIndex);

        if (userWin && chosenRatio) {
          // play win sound
          if (!this.sound.locked) this.sound.play('winSound', { volume: 1 });
          else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('winSound', { volume: 1 }));

          if (this.myConfetti) {
            this.time.delayedCall(0, () => {
              this.myConfetti({ particleCount: 100, spread: 60, origin: { y: 0.35 } });
            });
          }

          // win amount = bet * ratio (per round) — accumulate
          const winAmount = parseFloat((this.hiloBetAmount * chosenRatio).toFixed(2));
          this.prizePool = parseFloat((this.prizePool + winAmount).toFixed(2));

          // update cashout button
          this.updateCashoutButton();

          // add card image on first empty slot
          const emptySlot = this.hiloHistorySlot.find(s => !s.cardImage);
          if (emptySlot) {
            const cardOnSlot = this.add.image(emptySlot.x, emptySlot.y, indexToKey(currentIndex))
              .setDisplaySize(96, 96)
              .setOrigin(0.5);
            emptySlot.cardImage = cardOnSlot;
            betPanelContainer.add(cardOnSlot);
          }

          // check if all 5 slots filled
          const filledSlots = this.hiloHistorySlot.filter(s => s.cardImage).length;
          if (filledSlots >= 5) {
            // reset everything
            this.hiloHistorySlot.forEach(slot => {
              if (slot.cardImage) {
                slot.cardImage.destroy();
                slot.cardImage = null;
              }
            });
            this.prizePool = 0;
            this.updateCashoutButton();
            this.hiloGameStarted = false;
          }
        } else {
          // LOSS - bet amount is already deducted, now reset bet to 0
          if (!this.sound.locked) this.sound.play('loseSound', { volume: 1 });
          else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('loseSound', { volume: 1 }));

          // clear all slots
          this.hiloHistorySlot.forEach(slot => {
            if (slot.cardImage) {
              slot.cardImage.destroy();
              slot.cardImage = null;
            }
          });

          this.prizePool = 0;
          this.updateCashoutButton();
          this.hiloGameStarted = false;
        }

        balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
      });
    };

    // wire higher/lower buttons to startRound
    upBtnImg.on('pointerdown', () => startRound(true));
    downBtnImg.on('pointerdown', () => startRound(false));

    // store refs
    this.hilo = {
      card,
      leftRateText,
      rightRateText,
      upBtnImg,
      downBtnImg,
      leftArrowImg,
      rightArrowImg,
      currentIndex,
      balanceText
    };
  }

  setupCoinFlip() {
    const panelWidth = this.contentWidth;
    const betPanelHeight = 600;
    const panelHeight = this.contentHeight - this.headerHeight - betPanelHeight;
    const startX = 0;
    const startY = 0;

    // panel background
    const coinPanelBgRect = this.add.image(startX, startY, 'panelBg').setOrigin(0).setDisplaySize(panelWidth, panelHeight);
    this.coinFlipContainer.add(coinPanelBgRect);

    // inner area
    const coinContentLeft = startX + 20;
    const coinContentTop = startY + 20;
    const coinContentW = panelWidth;
    const coinContentH = panelHeight;
    const coinCenterX = coinContentLeft + coinContentW / 2;
    const coinCenterY = coinContentTop + coinContentH / 2 + 150;

    const settingButtons = this.createSettingButtons(startX + 160, startY + 60);
    this.coinFlipContainer.add(settingButtons);

    const seriesBox = this.add.image(startX + panelWidth / 2 - 320, startY + 220, 'history_slot').setDisplaySize(180, 180);
    const seriesText = this.add.text(seriesBox.x, seriesBox.y, "0 \n\nSeries", { font: "24px Inter", align: 'center', color: "#000" }).setOrigin(0.5);

    const multiplyBox = this.add.image(startX + panelWidth / 2 - 120, startY + 220, 'history_slot').setDisplaySize(180, 180);
    const multiplyText = this.add.text(multiplyBox.x, multiplyBox.y, "x0.00 \n\nMultiplier", { font: "24px Inter", align: 'center', color: "#000" }).setOrigin(0.5);

    this.coinFlipContainer.add([seriesBox, seriesText, multiplyBox, multiplyText]);

    const COIN_SIZE = 160 * 2;
    let coinCurrentSide = Math.random() < 0.5 ? 0 : 1;
    const coinKey = coinCurrentSide === 0 ? 'coin_head' : 'coin_tail';

    const coinImage = this.add.image(coinCenterX, coinCenterY - 150, coinKey)
      .setOrigin(0.5)
      .setDisplaySize(COIN_SIZE, COIN_SIZE);
    this.coinFlipContainer.add(coinImage);

    const shadow = this.add.image(coinCenterX, coinCenterY + 100, 'shadow')
      .setOrigin(0.5)
      .setDisplaySize(344, 60);
    this.coinFlipContainer.add(shadow);

    let coinIsFlipping = false;
    const revealCoin = (finalSide, onComplete = null) => {
      if (coinIsFlipping) return;
      coinIsFlipping = true;

      // source frame sizes (texture pixels)
      const srcW = (coinImage.frame && coinImage.frame.width) ? coinImage.frame.width : COIN_SIZE;
      const srcH = (coinImage.frame && coinImage.frame.height) ? coinImage.frame.height : COIN_SIZE;

      const flipCount = 16;
      const flipDuration = 20; // ms per half flip
      const minCropW = Math.max(4, Math.round(srcW * 0.04)); // small safe minimum
      let currentFlip = 0;

      const applyCenteredCrop = (img, cropW) => {
        const left = Math.floor((srcW - cropW) / 2);
        img.setCrop(left, 0, cropW, srcH);
      };

      // ensure display size locked
      coinImage.setDisplaySize(COIN_SIZE, COIN_SIZE);

      const expandHalf = () => {
        const state = { w: minCropW };
        this.tweens.add({
          targets: state,
          w: srcW,
          duration: flipDuration,
          ease: 'Linear',
          onUpdate: () => {
            const w = Math.round(state.w);
            applyCenteredCrop(coinImage, w);
          },
          onComplete: () => {
            currentFlip++;
            if (currentFlip < flipCount) {
              shrinkHalf();
            } else {
              // finalize: show final side, clear crop by setting full crop
              coinImage.setTexture(finalSide === 0 ? 'coin_head' : 'coin_tail');
              coinImage.setDisplaySize(COIN_SIZE, COIN_SIZE);
              // replace clearCrop() with full setCrop
              coinImage.setCrop(0, 0, srcW, srcH);
              coinIsFlipping = false;
              if (typeof onComplete === 'function') onComplete();
            }
          }
        });
      };

      const shrinkHalf = () => {
        const state = { w: srcW };
        this.tweens.add({
          targets: state,
          w: minCropW,
          duration: flipDuration,
          ease: 'Linear',
          onUpdate: () => {
            const w = Math.max(minCropW, Math.round(state.w));
            applyCenteredCrop(coinImage, w);
          },
          onComplete: () => {
            // swap texture at mid-flip (alternate)
            const nextShowHead = (currentFlip % 2 === 0);
            coinImage.setTexture(nextShowHead ? 'coin_tail' : 'coin_head');
            coinImage.setDisplaySize(COIN_SIZE, COIN_SIZE);
            // ensure other image is cropped small before expand
            applyCenteredCrop(coinImage, minCropW);
            expandHalf();
          }
        });
      };

      // init crop to full then start
      coinImage.setCrop(0, 0, srcW, srcH);
      shrinkHalf();
    };

    // === Bet panel ===
    // Create betPanel container at the bottom
    const betPanelContainer = this.add.container(0, panelHeight);
    this.coinFlipContainer.add(betPanelContainer);

    const coinBetPanelX = coinContentLeft + coinContentW / 2 - 10;
    const coinBetPanelY = betPanelHeight / 2;

    const coinBetBg = this.add.rectangle(coinBetPanelX, coinBetPanelY, coinContentW, betPanelHeight, 0xFFFFFF, 0.95)
      .setOrigin(0.5).setStrokeStyle(2, 0x888888, 0.3);
    betPanelContainer.add(coinBetBg);

    // floating panel
    const floatingPanelWidth = coinContentW - 250;
    const floatingPanelHeight = 500;
    const floatingPanelY = coinBetPanelY - betPanelHeight / 2 + 300;
    const floatingPanelRadius = 20;

    // soft shadow layers
    const shadowLayers = [
      { offsetY: 5, blur: 6, alpha: 0.03 },
      { offsetY: 5, blur: 3, alpha: 0.04 },
      { offsetY: 5, blur: 1.5, alpha: 0.03 }
    ];

    shadowLayers.forEach(layer => {
      const shadowGraphics = this.add.graphics();
      shadowGraphics.fillStyle(0x000000, layer.alpha);
      shadowGraphics.fillRoundedRect(
        coinBetPanelX - floatingPanelWidth / 2 - layer.blur,
        floatingPanelY - floatingPanelHeight / 2 + layer.offsetY - layer.blur,
        floatingPanelWidth + (layer.blur * 2),
        floatingPanelHeight + (layer.blur * 2),
        floatingPanelRadius + layer.blur
      );
      betPanelContainer.add(shadowGraphics);
    });

    const floatingPanelGraphics = this.add.graphics();
    floatingPanelGraphics.fillStyle(0xffffff, 1);
    floatingPanelGraphics.fillRoundedRect(
      coinBetPanelX - floatingPanelWidth / 2,
      floatingPanelY - floatingPanelHeight / 2,
      floatingPanelWidth,
      floatingPanelHeight,
      floatingPanelRadius
    );
    floatingPanelGraphics.lineStyle(2, 0xe0e0e0, 1);
    floatingPanelGraphics.strokeRoundedRect(
      coinBetPanelX - floatingPanelWidth / 2,
      floatingPanelY - floatingPanelHeight / 2,
      floatingPanelWidth,
      floatingPanelHeight,
      floatingPanelRadius
    );
    betPanelContainer.add(floatingPanelGraphics);

    const slotSpacing = 170;
    this.coinFlipHistorySlot = [];

    for (let i = 0; i < 5; i++) {
      let slot = this.add.image(coinBetPanelX + 3 + (i - 2) * slotSpacing, coinBetPanelY - 440, 'history_slot')
        .setDisplaySize(150, 150)
        .setOrigin(0.5);
      this.coinFlipHistorySlot.push(slot)
    }
    betPanelContainer.add(this.coinFlipHistorySlot);

    // balance text (shared)
    this.userBalance = (typeof this.userBalance === 'number') ? this.userBalance : (typeof this.balance === 'number' ? this.balance : 1000);
    const coinBalanceText = this.add.text(coinBetPanelX - 400, coinBetPanelY - 200, `Balance: ${currency.format(this.userBalance)} coins`, {
      font: "48px Inter", color: '#000000', align: 'left'
    }).setOrigin(0, 0.5);
    betPanelContainer.add(coinBalanceText);

    const infoIcon = this.add.image(coinBetPanelX + 375, coinBetPanelY - 200, 'info_icon')
      .setOrigin(0.5).setDisplaySize(48, 48).setInteractive({ useHandCursor: true });
    betPanelContainer.add(infoIcon);

    // expose ref for sync
    this.coinFlip = this.coinFlip || {};
    this.coinFlip.balanceText = coinBalanceText;

    // Fixed bet amount - always 10 tokens per play
    this.coinBetAmount = 10.00;

    // Heads / Tails buttons
    const coinHeadBtn = this.add.image(coinBetPanelX + 220, coinBetPanelY - 50, 'bet_head')
      .setOrigin(0.5).setDisplaySize(360, 170).setInteractive({ useHandCursor: true });
    this.addPressEffect(coinHeadBtn);

    const coinTailBtn = this.add.image(coinBetPanelX - 220, coinBetPanelY - 50, 'bet_tail')
      .setOrigin(0.5).setDisplaySize(360, 170).setInteractive({ useHandCursor: true });
    this.addPressEffect(coinTailBtn);

    const infoTextIcon = this.add.image(coinBetPanelX - 200, coinBetPanelY + 225, 'info_icon')
      .setOrigin(0.5).setDisplaySize(32, 32).setInteractive({ useHandCursor: true });
    betPanelContainer.add(infoTextIcon);

    const infoText = this.add.text(coinBetPanelX - 164, coinBetPanelY + 225, `Betting 1 time with 10 coins.`, {
      font: "24px Inter", color: '#636363', align: 'left'
    }).setOrigin(0, 0.5);
    betPanelContainer.add(infoText);

    // prize pool & cashout (coin-specific)
    this.coinPrizePool = 0.00;
    const coinCashoutBg = this.add.image(coinBetPanelX, coinBetPanelY + 135, 'cashout_button')
      .setOrigin(0.5)
      .setDisplaySize(720, 100)
      .setInteractive();

    const coinCashoutText = this.add.text(coinCashoutBg.x, coinCashoutBg.y, "CASHOUT", { font: "48px Inter", color: '#FFF' }).setOrigin(0.5);
    this.addPressEffect(coinCashoutBg, coinCashoutText);
    this.coinCashoutEnabled = false;

    const updateCoinCashout = () => {
      if (this.coinPrizePool > 0) {
        coinCashoutText.setText(`CASHOUT $${currency.format(this.coinPrizePool)}`);
        coinCashoutText.setColor('#FFF');
        this.coinCashoutEnabled = true;
        coinCashoutBg.setInteractive({ useHandCursor: true });
      } else {
        coinCashoutText.setText("CASHOUT");
        coinCashoutText.setColor('#FFF');
        this.coinCashoutEnabled = false;
        coinCashoutBg.disableInteractive();
      }
    };

    coinCashoutBg.on('pointerdown', () => {
      if (!this.coinCashoutEnabled) return;

      this.userBalance = parseFloat((this.userBalance + this.coinPrizePool).toFixed(2));
      coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);

      if (!this.sound.locked) this.sound.play('ka-chingSound', { volume: 1 });
      else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('ka-chingSound', { volume: 1 }));

      this.coinPrizePool = 0;
      updateCoinCashout();

      // reset game state
      this.coinGameStarted = false;

      // clear coin history
      this.coinFlipHistorySlot.forEach(slot => {
        if (slot.coinImage) {
          slot.coinImage.destroy();
          slot.coinImage = null;
        }
      });
    });

    this.updateCashoutButton();
    betPanelContainer.add([coinHeadBtn, coinTailBtn, coinCashoutBg, coinCashoutText]);

    // Flip / round logic
    this.coinGameStarted = false;
    const COIN_MULTIPLIER = 1.95; // payout multiplier for correct guess

    const startCoinRound = (choiceIsHeads) => {
      // Check if user has enough balance
      if (this.userBalance < this.coinBetAmount) return;

      // Deduct bet from balance
      this.setUserBalance(this.userBalance - this.coinBetAmount);
      coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);

      if (!this.coinGameStarted) {
        this.coinGameStarted = true;
      }

      const result = Math.random() < 0.5 ? 0 : 1; // 0 heads, 1 tails
      const userWin = (choiceIsHeads && result === 0) || (!choiceIsHeads && result === 1);

      revealCoin(result, () => {
        if (userWin) {
          if (!this.sound.locked) this.sound.play('winSound', { volume: 1 });
          else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('winSound', { volume: 1 }));

          if (this.myConfetti) {
            this.time.delayedCall(0, () => {
              this.myConfetti({ particleCount: 100, spread: 60, origin: { y: 0.35 } });
            });
          }

          const winAmount = parseFloat((this.coinBetAmount * COIN_MULTIPLIER).toFixed(2));
          this.coinPrizePool = parseFloat((this.coinPrizePool + winAmount).toFixed(2));
          updateCoinCashout();

          // add coin result into first empty slot
          const emptySlot = this.coinFlipHistorySlot.find(s => !s.coinImage);
          if (emptySlot) {
            const coinKey = result === 0 ? 'coin_head' : 'coin_tail';
            const coinOnSlot = this.add.image(emptySlot.x, emptySlot.y, coinKey)
              .setDisplaySize(96, 96)
              .setOrigin(0.5);
            emptySlot.coinImage = coinOnSlot;
            this.coinFlipContainer.add(coinOnSlot);
          }

          // check if all 5 slots filled
          const filledSlots = this.coinFlipHistorySlot.filter(s => s.coinImage).length;
          if (filledSlots >= 5) {
            this.coinFlipHistorySlot.forEach(slot => {
              if (slot.coinImage) {
                slot.coinImage.destroy();
                slot.coinImage = null;
              }
            });
            this.coinPrizePool = 0;
            updateCoinCashout();
            this.coinGameStarted = false;
          }

        } else {
          // LOSS - bet amount is already deducted, now reset bet to 0
          if (!this.sound.locked) this.sound.play('loseSound', { volume: 1 });
          else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('loseSound', { volume: 1 }));

          this.coinFlipHistorySlot.forEach(slot => {
            if (slot.coinImage) {
              slot.coinImage.destroy();
              slot.coinImage = null;
            }
          });

          this.coinPrizePool = 0;
          updateCoinCashout();
          this.coinGameStarted = false;
        }

        coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
      });
    };

    // wire up head/tail buttons
    coinHeadBtn.on('pointerdown', () => startCoinRound(true));
    coinTailBtn.on('pointerdown', () => startCoinRound(false));

    // store refs
    this.coinFlip = {
      coinImage,
      coinHeadBtn,
      coinTailBtn,
      coinBalanceText,
      updateCoinCashout,
      coinCurrentSide
    };
  }

  handleSafeClick() {

  }

  showHelpPopup() {

  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) {
      this.bgm.resume();
      this.sound.mute = false;
    } else {
      this.bgm.pause();
      this.sound.mute = true;
    }
  }
}