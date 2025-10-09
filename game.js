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

  init(data) {
    this.balance = data.balance ?? 1000;
  }

  preload() {
    this.load.image('background', 'images/background.png');
    this.load.image('item', 'images/item.png');

    const suits = ["diamonds", "clubs", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    suits.forEach(suit => ranks.forEach(rank => {
      this.load.image(`${rank}_of_${suit}`, `images/cards/${rank}_of_${suit}.png`);
    }));

    this.load.image('lucky_shop', 'images/lucky_shop.png');
    this.load.image('hilo_game', 'images/hilo_game.png');
    this.load.image('coinflip_game', 'images/coinflip_game.png');

    this.load.image('card_back', 'images/card_back.png');
    this.load.image('up_arrow', 'images/up_arrow.png');
    this.load.image('down_arrow', 'images/down_arrow.png');
    this.load.image('bet_higher', 'images/bet_higher.png');
    this.load.image('bet_lower', 'images/bet_lower.png');
    this.load.image('bet_head', 'images/bet_head.png');
    this.load.image('bet_tail', 'images/bet_tail.png');

    this.load.image('coin_head', 'images/coin_head.png');
    this.load.image('coin_tail', 'images/coin_tail.png');
    
    this.load.image('history_slot', 'images/history_slot.png');

    this.load.audio('bgm', 'sounds/background_music.mp3');
    this.load.audio('click', 'sounds/click.mp3');
    this.load.audio('winSound', 'sounds/win.mp3');
    this.load.audio('loseSound', 'sounds/lose.mp3');
    this.load.audio('ka-chingSound', 'sounds/ka-ching.mp3');
    this.load.image('cashout_button', 'images/cashout_button.png');
  }

  create() {
    const confettiCanvas = document.getElementById('confetti');
    this.myConfetti = confetti.create(confettiCanvas, {
      resize: true,
      useWorker: true
    });

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // play bgm safely
    this.sound.unlock();
    this.bgm = this.sound.add('bgm', { loop: true });
    if (!this.sound.locked) {
      this.bgm.play();
    } else {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => { this.bgm.play(); });
    }

    // background full screen
    this.add.image(width / 2, height / 2, 'background').setDisplaySize(1920, 1080);

    // Content column size (portrait)
    this.contentWidth = 576;
    this.contentHeight = 1080;

    // center content column horizontally
    const contentX = Math.round((width - this.contentWidth) / 2);

    // nav area starts at right of content
    this.navWidth = Math.max(200, width - (contentX + this.contentWidth));
    const navX = this.contentWidth + 250;

    // containers (positioned at contentX so children use same local coords)
    this.shopContainer = this.add.container(contentX, 0).setVisible(true);
    this.hiloContainer = this.add.container(contentX, 0).setVisible(false);
    this.coinFlipContainer = this.add.container(contentX, 0).setVisible(false);

    // build screens
    this.setupShop();
    this.setupHilo();
    this.setupCoinFlip();

    // right nav (floating circles)
    this.createRightNav(navX);
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

  createRightNav(navX) {
    this.navContainer = this.add.container(navX, 0);

    const buttons = ['lucky_shop', 'hilo_game', 'coinflip_game'];
    const containers = [this.shopContainer, this.hiloContainer, this.coinFlipContainer];

    const spacingY = 85;
    const startY = 80;

    buttons.forEach((key, i) => {
      const cx = Math.round(this.navWidth / 2);
      const cy = startY + i * spacingY;

      const btn = this.add.image(cx, cy, key)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          containers.forEach((c, idx) => c.setVisible(idx === i));
          if (typeof this.setUserBalance === 'function') this.setUserBalance(this.userBalance);
        });

      this.addPressEffect(btn, null, 4);
      this.navContainer.add(btn);
    });
  }

  setUserBalance(amount) {
    const v = parseFloat(Number(amount) || 0);
    this.userBalance = parseFloat(v.toFixed(2));
    const txt = `Balance: ${currency.format(this.userBalance)}`;
    if (this.hilo && this.hilo.balanceText) this.hilo.balanceText.setText(txt);
    if (this.coinFlip && this.coinFlip.balanceText) this.coinFlip.balanceText.setText(txt);
  }

  setupShop() {
    const panelWidth = this.contentWidth;
    const panelHeight = this.contentHeight;
    const startX = 20;
    const startY = 20;

    // background panel (light but slightly visible)
    const bg = this.add.rectangle(startX, startY, panelWidth - 40, panelHeight - 40, 0xffffff, 0.65)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this.shopContainer.add(bg);

    const scrollAreaHeight = panelHeight - 80;

    // Use add.graphics() (must be in display list) for geometry mask
    const maskGraphics = this.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(startX + 10, startY + 10, panelWidth - 60, scrollAreaHeight);
    // Hide the graphics itself so it doesn't show on screen
    maskGraphics.setVisible(false);

    const mask = maskGraphics.createGeometryMask();

    // Scrollable content container (center aligned inside panel area)
    const content = this.add.container(startX + panelWidth / 2, startY + scrollAreaHeight / 2);
    content.setMask(mask);
    this.shopContainer.add(content);

    // Grid setup
    const cols = 3;
    const rows = 3;
    const itemSize = 150;
    const spacing = 30;

    for (let i = 0; i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = (col - (cols - 1) / 2) * (itemSize + spacing);
      const y = (row - (rows - 1) / 2) * (itemSize + spacing);

      const itemContainer = this.add.container(x, y);

      // Card-like background for each item (higher contrast)
      const box = this.add.rectangle(0, 0, itemSize, itemSize, 0xf2f2f2)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0x222222);
      itemContainer.add(box);

      // Item image (use single key 'item' for fallback)
      const imgKey = `item${i + 1}`;
      const img = this.textures.exists(imgKey) ? this.add.image(0, -20, imgKey) : this.add.image(0, -20, 'item');
      img.setDisplaySize(80, 80).setOrigin(0.5);
      itemContainer.add(img);

      // Item name
      const name = this.add.text(0, 30, `Item ${i + 1}`, {
        font: "16px Brothers",
        color: "#111111",
        align: "center"
      }).setOrigin(0.5);
      itemContainer.add(name);

      // Price
      const price = this.add.text(0, 50, `$${(i + 1) * 10}`, {
        font: "14px Brothers",
        color: "#008800"
      }).setOrigin(0.5);
      itemContainer.add(price);

      // Buy button
      const btnHeight = 32;
      const paddingBottom = 5;
      const btnY = itemSize / 2 - (btnHeight / 2) - paddingBottom;
      const buyBtnBg = this.add.rectangle(0, btnY, itemSize - 12, btnHeight, 0x4444aa)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const buyBtnText = this.add.text(0, btnY, "Buy", {
        font: "14px Brothers",
        color: "#fff"
      }).setOrigin(0.5);

      buyBtnBg.on("pointerdown", () => {
        console.log(`Purchased Item ${i + 1}`);
        // hook purchase logic here
      });

      itemContainer.add(buyBtnBg);
      itemContainer.add(buyBtnText);

      content.add(itemContainer);
    }

    // Scroll with mouse wheel (only when shopContainer visible)
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.shopContainer.visible) return;
      content.y -= deltaY * 0.5;
      // clamp scroll so content won't scroll infinitely (optional)
      const maxScroll = (itemSize + spacing) * (rows / 2);
      const minY = startY + scrollAreaHeight / 2 - maxScroll;
      const maxY = startY + scrollAreaHeight / 2 + maxScroll;
      content.y = Phaser.Math.Clamp(content.y, minY, maxY);
    });
  }

  setupHilo() {
    const panelWidth = this.contentWidth;
    const panelHeight = this.contentHeight;
    const startX = 20;
    const startY = 20;

    // panel background
    const bg = this.add.rectangle(startX, startY, panelWidth - 40, panelHeight - 40, 0xffffff, 0.65)
      .setOrigin(0).setStrokeStyle(2, 0x000000);
    this.hiloContainer.add(bg);

    // inner area
    const contentLeft = startX + 20;
    const contentTop = startY + 20;
    const contentW = panelWidth - 60;
    const contentH = panelHeight - 80;
    const centerX = contentLeft + contentW / 2;
    const centerY = contentTop + contentH / 2 - 30;

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
    const CARD_W = 160, CARD_H = 240;
    const tex = this.textures.get(cardKey);
    const baseWidth = (tex && tex.source && tex.source[0]) ? tex.source[0].width : card.width || CARD_W;
    const baseHeight = (tex && tex.source && tex.source[0]) ? tex.source[0].height : card.height || CARD_H;
    card.setScale(CARD_W / baseWidth, CARD_H / baseHeight);

    // Skip button
    const skipY = centerY - 25;
    const skipBtn = this.add.rectangle(centerX, skipY, 120, 44, 0x6666aa).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const skipText = this.add.text(centerX, skipY, "Skip", { font: "20px Brothers", color: "#ffffff" }).setOrigin(0.5);
    this.addPressEffect(skipBtn, skipText);
    this.hiloContainer.add([skipBtn, skipText]);

    // arrows + rate texts
    const arrowOffsetX = Math.min(220, contentW * 0.32);
    const arrowY = centerY - 100;

    const leftArrowImg = this.add.image(centerX - arrowOffsetX, arrowY, 'down_arrow').setDisplaySize(68, 48).setOrigin(0.5);
    const leftRateText = this.add.text(centerX - arrowOffsetX, arrowY - 70, '—', { font: "bold 48px Brothers", color: "#ff4d4d", align: 'center' }).setOrigin(0.5);
    leftRateText.setStroke('#000000', 6);
    this.hiloContainer.add([leftArrowImg, leftRateText]);

    const rightArrowImg = this.add.image(centerX + arrowOffsetX, arrowY, 'up_arrow').setDisplaySize(68, 48).setOrigin(0.5);
    const rightRateText = this.add.text(centerX + arrowOffsetX, arrowY - 70, '—', { font: "bold 48px Brothers", color: "#33cc33", align: 'center' }).setOrigin(0.5);
    rightRateText.setStroke('#000000', 6);
    this.hiloContainer.add([rightArrowImg, rightRateText]);

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
    const betPanelHeight = 400;
    const betPanelX = contentLeft + contentW / 2 - 10;
    const betPanelY = contentTop + contentH - betPanelHeight / 2 + 10;

    const slotSpacing = 100;
    this.hiloHistorySlot = [];

    for (let i = 0; i < 5; i++) {
      let slot = this.add.image(betPanelX + 3 + (i - 2) * slotSpacing, betPanelY - 265,'history_slot').setDisplaySize(100, 100).setOrigin(0.5);
      this.hiloHistorySlot.push(slot);
    }

    this.hiloContainer.add(this.hiloHistorySlot);

    const betBg = this.add.rectangle(betPanelX, betPanelY, contentW, betPanelHeight, 0x222222, 0.95)
      .setOrigin(0.5).setStrokeStyle(2, 0xffd700);
    this.hiloContainer.add(betBg);

    // balance text (local to hilo screen)
    this.userBalance = (typeof this.userBalance === 'number') ? this.userBalance : (typeof this.balance === 'number' ? this.balance : 1000);
    const balanceText = this.add.text(betPanelX - 100, betPanelY - 170, `Balance: ${currency.format(this.userBalance)}`, {
      font: "20px Brothers", color: '#ffffff', align: 'center'
    }).setOrigin(0, 0.5);
    this.hiloContainer.add(balanceText);

    // expose ref for sync
    this.hilo = this.hilo || {};
    this.hilo.balanceText = balanceText;

    // bet input box (display only)
    this.hiloBetAmount = 0.00;
    const inputBg = this.add.rectangle(betPanelX + 5, betPanelY - 130, 280, 40, 0x000000).setOrigin(0.5).setStrokeStyle(2, 0xffffff);
    this.hiloContainer.add(inputBg);

    const betInput = this.add.text(betPanelX + 5, betPanelY - 130, currency.format(this.hiloBetAmount), {
      font: "20px Brothers", color: '#fff'
    }).setOrigin(0.5);
    this.hiloContainer.add(betInput);

    // toggle group (step values)
    const betValues = [1, 5, 10, 50, 100];
    this.selectedStep = 1;
    const btnWidth = 70, btnHeight = 36, spacing = 15;
    const totalWidth = betValues.length * btnWidth + (betValues.length - 1) * spacing;
    const startBtnX = betPanelX - totalWidth / 2 + 40;
    const btnY = betPanelY - 75;
    this.hiloBetButtons = [];

    betValues.forEach((val, idx) => {
      const x = startBtnX + idx * (btnWidth + spacing);
      const b = this.add.rectangle(x, btnY, btnWidth, btnHeight, 0x555555).setOrigin(0.5).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, btnY, val.toString(), { font: "18px Brothers", color: "#fff" }).setOrigin(0.5);

      b.on("pointerdown", () => {
        this.selectedStep = val;
        this.hiloBetButtons.forEach(btn => btn.bg.setFillStyle(0x555555));
        b.setFillStyle(0x008800);
      });

      this.addPressEffect(b, label);
      this.hiloContainer.add([b, label]);
      this.hiloBetButtons.push({ bg: b, label, val });
    });
    if (this.hiloBetButtons[0]) this.hiloBetButtons[0].bg.setFillStyle(0x008800);

    // plus / minus logic (reserve funds immediately)
    const minusBg = this.add.rectangle(betPanelX - 175, betPanelY - 130, 50, 40, 0x884444).setOrigin(0.5).setInteractive();
    const minusText = this.add.text(minusBg.x, minusBg.y, "-", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);

    minusBg.on("pointerdown", () => {
      const step = this.selectedStep;
      if (this.hiloBetAmount >= step) {
        this.hiloBetAmount = parseFloat((this.hiloBetAmount - step).toFixed(2));
        this.userBalance = parseFloat((this.userBalance + step).toFixed(2));
      } else {
        // return entire bet to balance
        this.userBalance = parseFloat((this.userBalance + this.hiloBetAmount).toFixed(2));
        this.hiloBetAmount = 0;
      }
      betInput.setText(currency.format(this.hiloBetAmount));
      balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
    });
    this.addPressEffect(minusBg, minusText);

    const plusBg = this.add.rectangle(betPanelX + 185, betPanelY - 130, 50, 40, 0x448844).setOrigin(0.5).setInteractive();
    const plusText = this.add.text(plusBg.x, plusBg.y, "+", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);

    plusBg.on("pointerdown", () => {
      const step = this.selectedStep;
      if (this.userBalance >= step) {
        this.hiloBetAmount = parseFloat((this.hiloBetAmount + step).toFixed(2));
       this.setUserBalance(this.userBalance - step);
      }
      betInput.setText(currency.format(this.hiloBetAmount));
      balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
    });
    this.addPressEffect(plusBg, plusText);

    this.hiloContainer.add([minusBg, minusText, plusBg, plusText]);

    // percent buttons (use availableBalance = userBalance + currentBet)
    const percents = [0, 25, 50, 75, 100];
    const quickStartX = betPanelX - totalWidth / 2 + 40;
    const quickY = betPanelY - 30;
    this.hiloPercentButtons = [];

    percents.forEach((p, idx) => {
      const px = quickStartX + idx * 85;
      const pBg = this.add.rectangle(px, quickY, 70, 32, 0x444444).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const pLabel = p === 0 ? "Clear" : `${p}%`;
      const pText = this.add.text(px, quickY, pLabel, { font: "16px Brothers", color: "#fff" }).setOrigin(0.5);

      pBg.on('pointerdown', () => {
        const availableBalance = parseFloat((this.userBalance + this.hiloBetAmount).toFixed(2));
        const newBet = p === 0 ? 0 : parseFloat((availableBalance * (p / 100)).toFixed(2));
        this.hiloBetAmount = newBet;
        this.userBalance = parseFloat((availableBalance - newBet).toFixed(2));
        betInput.setText(currency.format(this.hiloBetAmount));
        balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
      });

      this.addPressEffect(pBg, pText);
      this.hiloContainer.add([pBg, pText]);
      this.hiloPercentButtons.push(pBg);
    });

    // Higher / Lower buttons - create BEFORE revealCard (revealCard uses these refs)
    const upBtnImg = this.add.image(betPanelX + contentW / 4 - 25, betPanelY + 50, 'bet_higher')
      .setOrigin(0.5).setDisplaySize(158, 69).setInteractive({ useHandCursor: true });
    this.addPressEffect(upBtnImg);

    const downBtnImg = this.add.image(betPanelX + contentW / 4 - 225, betPanelY + 50, 'bet_lower')
      .setOrigin(0.5).setDisplaySize(158, 69).setInteractive({ useHandCursor: true });
    this.addPressEffect(downBtnImg);

    // prize pool & cashout
    this.prizePool = 0.00;
    const cashoutBg = this.add.rectangle(betPanelX + contentW / 4 - 125, betPanelY + 125, 280, 40, 0x000000)
      .setOrigin(0.5).setStrokeStyle(2, 0xffd700);
    const cashoutText = this.add.text(cashoutBg.x, cashoutBg.y, "Cashout", { font: "20px Brothers", color: '#888888' }).setOrigin(0.5);
    this.addPressEffect(cashoutBg, cashoutText);
    this.cashoutEnabled = false;

    this.updateCashoutButton = () => {
      if (this.prizePool > 0) {
        cashoutText.setText(`Cashout $${currency.format(this.prizePool)}`);
        cashoutText.setColor('#FFD700');
        this.cashoutEnabled = true;
        cashoutBg.setInteractive({ useHandCursor: true });
      } else {
        cashoutText.setText("Cashout");
        cashoutText.setColor('#888888');
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
      skipBtn.setVisible(true);
      skipText.setVisible(true);

      this.hiloBetButtons.forEach(b => {
        b.bg.setInteractive({ useHandCursor: true }).setFillStyle(b.val === this.selectedStep ? 0x008800 : 0x555555);
        b.label.setColor('#ffffff');
      });
      plusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
      minusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
      this.hiloPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));
      betInput.setColor('#ffffff');
    });

    this.updateCashoutButton();
    this.hiloContainer.add([upBtnImg, downBtnImg, cashoutBg, cashoutText]);

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

    // skip logic (flip to random new card)
    skipBtn.on('pointerdown', () => {
      let nextIndex = getRandomIndex();
      if (nextIndex === currentIndex && 52 > 1) {
        for (let i = 0; i < 6 && nextIndex === currentIndex; i++) nextIndex = getRandomIndex();
      }
      revealCard(nextIndex, () => updateRates(currentIndex));
    });

    this.hiloGameStarted = false;
    const startRound = (isHigher) => {
      if (this.hiloBetAmount <= 0) return;

      if (!this.hiloGameStarted) {
        skipBtn.setVisible(false); skipText.setVisible(false);

        this.hiloBetButtons.forEach(b => { b.bg.disableInteractive().setFillStyle(0x333333); b.label.setColor('#888888'); });
        plusBg.disableInteractive().setFillStyle(0x333333);
        minusBg.disableInteractive().setFillStyle(0x333333);
        this.hiloPercentButtons.forEach(pBg => pBg.disableInteractive().setFillStyle(0x333333));
        betInput.setColor('#888888');

        this.hiloGameStarted = true;
      }

      const currentRank = getRank(currentIndex);
      let nextIndex = getRandomIndex();
      while (nextIndex === currentIndex && 52 > 1) nextIndex = getRandomIndex();
      const nextRank = getRank(nextIndex);

      const userWin = (isHigher && nextRank > currentRank) || (!isHigher && nextRank < currentRank);
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
            const cardOnSlot = this.add.image(emptySlot.x - 3, emptySlot.y - 3, indexToKey(currentIndex))
              .setDisplaySize(60, 75)
              .setOrigin(0.5);
            emptySlot.cardImage = cardOnSlot;
            this.hiloContainer.add(cardOnSlot);
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
          // LOSS
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

          // reveal done, show skip and unlock panel
          skipBtn.setVisible(true); skipText.setVisible(true);

          this.hiloBetButtons.forEach(b => {
            b.bg.setInteractive({ useHandCursor: true }).setFillStyle(b.val === this.selectedStep ? 0x008800 : 0x555555);
            b.label.setColor('#ffffff');
          });
          plusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
          minusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
          this.hiloPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));
          betInput.setColor('#ffffff');
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
      betInput,
      upBtnImg,
      downBtnImg,
      leftArrowImg,
      rightArrowImg,
      skipBtn,
      skipText,
      currentIndex
    };
  }

  setupCoinFlip() {
    const panelWidth = this.contentWidth;
    const panelHeight = this.contentHeight;
    const startX = 20;
    const startY = 20;

    // panel background
    const coinPanelBgRect = this.add.rectangle(startX, startY, panelWidth - 40, panelHeight - 40, 0xffffff, 0.65)
      .setOrigin(0).setStrokeStyle(2, 0x000000);
    this.coinFlipContainer.add(coinPanelBgRect);

    // inner area
    const coinContentLeft = startX + 20;
    const coinContentTop = startY + 20;
    const coinContentW = panelWidth - 60;
    const coinContentH = panelHeight - 80;
    const coinCenterX = coinContentLeft + coinContentW / 2;
    const coinCenterY = coinContentTop + coinContentH / 2 - 40;

    const COIN_SIZE = 160;
    let coinCurrentSide = Math.random() < 0.5 ? 0 : 1;
    const coinKey = coinCurrentSide === 0 ? 'coin_head' : 'coin_tail';

    const coinImage = this.add.image(coinCenterX, coinCenterY - 200, coinKey)
      .setOrigin(0.5)
      .setDisplaySize(COIN_SIZE, COIN_SIZE);
    this.coinFlipContainer.add(coinImage);

    const coinSideLabel = this.add.text(
      coinCenterX,
      coinCenterY - 350,
      coinCurrentSide === 0 ? 'HEADS' : 'TAILS',
      { font: "28px Brothers", color: "#ffffff" }
    ).setOrigin(0.5);
    coinSideLabel.setStroke('#000000', 6);
    this.coinFlipContainer.add(coinSideLabel);

    let coinIsFlipping = false;
    const revealCoin = (finalSide, onComplete = null) => {
      if (coinIsFlipping) return;
      coinIsFlipping = true;

      // source frame sizes (texture pixels)
      const srcW = (coinImage.frame && coinImage.frame.width) ? coinImage.frame.width : COIN_SIZE;
      const srcH = (coinImage.frame && coinImage.frame.height) ? coinImage.frame.height : COIN_SIZE;

      const flipCount = 32;
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
              coinSideLabel.setText(finalSide === 0 ? 'HEADS' : 'TAILS');
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

    // --- Bet panel (own panel but uses same this.userBalance) ---
    const coinBetPanelHeight = 400;
    const coinBetPanelX = coinContentLeft + coinContentW / 2 - 10;
    const coinBetPanelY = coinContentTop + coinContentH - coinBetPanelHeight / 2 + 10;

    const coinBetBg = this.add.rectangle(coinBetPanelX, coinBetPanelY, coinContentW, coinBetPanelHeight, 0x222222, 0.95)
      .setOrigin(0.5).setStrokeStyle(2, 0xffd700);
    this.coinFlipContainer.add(coinBetBg);

    // balance text (shared)
    this.userBalance = (typeof this.userBalance === 'number') ? this.userBalance : (typeof this.balance === 'number' ? this.balance : 1000);
    const coinBalanceText = this.add.text(coinBetPanelX - 100, coinBetPanelY - 170, `Balance: ${currency.format(this.userBalance)}`, {
      font: "20px Brothers", color: '#ffffff', align: 'center'
    }).setOrigin(0, 0.5);
    this.coinFlipContainer.add(coinBalanceText);

    // expose ref for sync
    this.coinFlip = this.coinFlip || {};
    this.coinFlip.balanceText = coinBalanceText;

    // bet input (display only)
    this.coinBetAmount = 0.00;
    const coinInputBg = this.add.rectangle(coinBetPanelX + 5, coinBetPanelY - 130, 280, 40, 0x000000).setOrigin(0.5).setStrokeStyle(2, 0xffffff);
    const coinBetInput = this.add.text(coinBetPanelX + 5, coinBetPanelY - 130, currency.format(this.coinBetAmount), {
      font: "20px Brothers", color: '#fff'
    }).setOrigin(0.5);
    this.coinFlipContainer.add([coinInputBg, coinBetInput]);

    // step toggle
    const coinBetValues = [1, 5, 10, 50, 100];
    this.coinSelectedStep = 1;
    const coinBtnWidth = 70, coinBtnHeight = 36, coinSpacing = 15;
    const coinTotalWidth = coinBetValues.length * coinBtnWidth + (coinBetValues.length - 1) * coinSpacing;
    const coinStartBtnX = coinBetPanelX - coinTotalWidth / 2 + 40;
    const coinBtnY = coinBetPanelY - 75;
    this.coinBetButtons = [];

    coinBetValues.forEach((val, idx) => {
      const x = coinStartBtnX + idx * (coinBtnWidth + coinSpacing);
      const b = this.add.rectangle(x, coinBtnY, coinBtnWidth, coinBtnHeight, 0x555555).setOrigin(0.5).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, coinBtnY, val.toString(), { font: "18px Brothers", color: "#fff" }).setOrigin(0.5);

      b.on("pointerdown", () => {
        this.coinSelectedStep = val;
        this.coinBetButtons.forEach(btn => btn.bg.setFillStyle(0x555555));
        b.setFillStyle(0x008800);
      });

      this.addPressEffect(b, label);
      this.coinFlipContainer.add([b, label]);
      this.coinBetButtons.push({ bg: b, label, val });
    });
    if (this.coinBetButtons[0]) this.coinBetButtons[0].bg.setFillStyle(0x008800);

    // plus / minus (reserve when increasing)
    const coinMinusBg = this.add.rectangle(coinBetPanelX - 175, coinBetPanelY - 130, 50, 40, 0x884444).setOrigin(0.5).setInteractive();
    const coinMinusText = this.add.text(coinMinusBg.x, coinMinusBg.y, "-", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);
    coinMinusBg.on("pointerdown", () => {
      const step = this.coinSelectedStep;
      if (this.coinBetAmount >= step) {
        this.coinBetAmount = parseFloat((this.coinBetAmount - step).toFixed(2));
        this.userBalance = parseFloat((this.userBalance + step).toFixed(2));
      } else {
        this.userBalance = parseFloat((this.userBalance + this.coinBetAmount).toFixed(2));
        this.coinBetAmount = 0;
      }
      coinBetInput.setText(currency.format(this.coinBetAmount));
      coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
    });
    this.addPressEffect(coinMinusBg, coinMinusText);

    const coinPlusBg = this.add.rectangle(coinBetPanelX + 185, coinBetPanelY - 130, 50, 40, 0x448844).setOrigin(0.5).setInteractive();
    const coinPlusText = this.add.text(coinPlusBg.x, coinPlusBg.y, "+", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);
    coinPlusBg.on("pointerdown", () => {
      const step = this.coinSelectedStep;
      if (this.userBalance >= step) {
        this.coinBetAmount = parseFloat((this.coinBetAmount + step).toFixed(2));
        this.setUserBalance(this.userBalance - step);
      }
      coinBetInput.setText(currency.format(this.coinBetAmount));
      coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
    });
    this.addPressEffect(coinPlusBg, coinPlusText);
    this.coinFlipContainer.add([coinMinusBg, coinMinusText, coinPlusBg, coinPlusText]);

    // percent quick buttons
    const coinPercents = [0, 25, 50, 75, 100];
    const coinQuickStartX = coinBetPanelX - coinTotalWidth / 2 + 40;
    const coinQuickY = coinBetPanelY - 30;
    this.coinPercentButtons = [];

    coinPercents.forEach((p, idx) => {
      const px = coinQuickStartX + idx * 85;
      const pBg = this.add.rectangle(px, coinQuickY, 70, 32, 0x444444).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const pLabel = p === 0 ? "Clear" : `${p}%`;
      const pText = this.add.text(px, coinQuickY, pLabel, { font: "16px Brothers", color: "#fff" }).setOrigin(0.5);

      pBg.on('pointerdown', () => {
        const availableBalance = parseFloat((this.userBalance + this.coinBetAmount).toFixed(2));
        const newBet = p === 0 ? 0 : parseFloat((availableBalance * (p / 100)).toFixed(2));
        this.coinBetAmount = newBet;
        this.userBalance = parseFloat((availableBalance - newBet).toFixed(2));
        coinBetInput.setText(currency.format(this.coinBetAmount));
        coinBalanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
      });

      this.addPressEffect(pBg, pText);
      this.coinFlipContainer.add([pBg, pText]);
      this.coinPercentButtons.push(pBg);
    });

    // Heads / Tails buttons
    const coinHeadBtn = this.add.image(coinBetPanelX + coinContentW / 4 - 25, coinBetPanelY + 50, 'bet_head')
      .setOrigin(0.5).setDisplaySize(158, 69).setInteractive({ useHandCursor: true });
    const coinTailBtn = this.add.image(coinBetPanelX + coinContentW / 4 - 225, coinBetPanelY + 50, 'bet_tail')
      .setOrigin(0.5).setDisplaySize(158, 69).setInteractive({ useHandCursor: true });

    this.addPressEffect(coinHeadBtn);
    this.addPressEffect(coinTailBtn);
    this.coinFlipContainer.add([coinHeadBtn, coinTailBtn]);

    // prize pool & cashout (coin-specific)
    this.coinPrizePool = 0.00;
    const coinCashoutBg = this.add.rectangle(coinBetPanelX + coinContentW / 4 - 125, coinBetPanelY + 125, 280, 40, 0x000000)
      .setOrigin(0.5).setStrokeStyle(2, 0xffd700);
    const coinCashoutText = this.add.text(coinCashoutBg.x, coinCashoutBg.y, "Cashout", { font: "20px Brothers", color: '#888888' }).setOrigin(0.5);
    this.addPressEffect(coinCashoutBg, coinCashoutText);
    this.coinCashoutEnabled = false;

    const updateCoinCashout = () => {
      if (this.coinPrizePool > 0) {
        coinCashoutText.setText(`Cashout $${currency.format(this.coinPrizePool)}`);
        coinCashoutText.setColor('#FFD700');
        this.coinCashoutEnabled = true;
        coinCashoutBg.setInteractive({ useHandCursor: true });
      } else {
        coinCashoutText.setText("Cashout");
        coinCashoutText.setColor('#888888');
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
      this.coinBetButtons.forEach(b => b.bg.setInteractive({ useHandCursor: true }).setFillStyle(0x555555));
      coinPlusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
      coinMinusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
      this.coinPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));
      coinBetInput.setColor('#ffffff');

      // clear coin history
      this.coinFlipHistorySlot.forEach(slot => {
        if (slot.coinImage) {
          slot.coinImage.destroy();
          slot.coinImage = null;
        }
      });
    });

    updateCoinCashout();
    this.coinFlipContainer.add([coinCashoutBg, coinCashoutText]);

    // Flip / round logic
    this.coinGameStarted = false;
    const COIN_MULTIPLIER = 1.95; // payout multiplier for correct guess

    const startCoinRound = (choiceIsHeads) => {
      if (this.coinBetAmount <= 0) return;

      if (!this.coinGameStarted) {
        // lock UI
        this.coinGameStarted = true;
        coinSideLabel.setText("");

        this.coinBetButtons.forEach(b => { b.bg.disableInteractive().setFillStyle(0x333333); b.label.setColor('#888888'); });
        coinPlusBg.disableInteractive().setFillStyle(0x333333);
        coinMinusBg.disableInteractive().setFillStyle(0x333333);
        this.coinPercentButtons.forEach(pBg => pBg.disableInteractive().setFillStyle(0x333333));
        coinBetInput.setColor('#888888');
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

          // add coin result into next available slot
          const nextSlot = this.coinFlipHistorySlot.find(slot => !slot.coinImage);
          if (nextSlot) {
            const iconKey = result === 0 ? 'coin_heads' : 'coin_tails';
            const icon = this.add.image(nextSlot.x, nextSlot.y, iconKey)
              .setDisplaySize(80, 80)
              .setDepth(nextSlot.depth + 1)
              .setOrigin(0.5);
            nextSlot.coinImage = icon;
          }

          // check if all 5 slots filled, then reset
          if (this.coinFlipHistorySlot.every(slot => slot.coinImage)) {
            this.time.delayedCall(1000, () => {
              this.coinFlipHistorySlot.forEach(slot => {
                if (slot.coinImage) {
                  slot.coinImage.destroy();
                  slot.coinImage = null;
                }
              });
            });
          }

        } else {
          // LOSS
          if (!this.sound.locked) this.sound.play('loseSound', { volume: 1 });
          else this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.sound.play('loseSound', { volume: 1 }));

          this.coinPrizePool = 0;
          updateCoinCashout();
          this.coinGameStarted = false;

          // clear history on loss
          this.coinFlipHistorySlot.forEach(slot => {
            if (slot.coinImage) {
              slot.coinImage.destroy();
              slot.coinImage = null;
            }
          });

          // unlock controls
          this.coinBetButtons.forEach(b => { b.bg.setInteractive({ useHandCursor: true }).setFillStyle(0x555555); b.label.setColor('#ffffff'); });
          coinPlusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
          coinMinusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
          this.coinPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));
          coinBetInput.setColor('#ffffff');
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
      coinSideLabel,
      coinBetInput,
      coinHeadBtn,
      coinTailBtn,
      coinBalanceText,
      updateCoinCashout,
      coinCurrentSide
    };
  }
}