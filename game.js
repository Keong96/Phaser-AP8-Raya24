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
    this.balance = data.balance;
  }

  preload() {
    this.load.image('background', 'images/background.png');
    this.load.image('item', 'images/item.png');

    const suits = ["diamonds", "clubs", "hearts", "spades"];
      const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

      suits.forEach(suit => {
        ranks.forEach(rank => {
          this.load.image(`${rank}_of_${suit}`, `images/cards/${rank}_of_${suit}.png`);
        });
      });

    this.load.image('card_back', 'images/card_back.png');
    this.load.image('up_arrow', 'images/up_arrow.png');

    this.load.image('down_arrow', 'images/down_arrow.png');
    this.load.image('bet_higher', 'images/bet_higher.png');
    this.load.image('bet_lower', 'images/bet_lower.png');

    this.load.audio('bgm', 'sounds/background_music.mp3');
    this.load.audio('click', 'sounds/click.mp3');
    this.load.audio('winSound', 'sounds/win.mp3');
    this.load.audio('loseSound', 'sounds/lose.mp3');
    this.load.audio('ka-chingSound', 'sounds/ka-ching.mp3');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.sound.unlock();
    var music = this.sound.add('bgm');
    
    if (!this.sound.locked) {
      music.play();
    }
    else {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        music.play();
      })
    }
      
    this.add.image(width / 2, height / 2, 'background').setDisplaySize(1920, 1080);

    // === Layout sizes ===
    this.contentWidth = width * 0.75;
    this.navWidth = width * 0.25;
    this.contentHeight = height;

    // === Content containers (anchored left) ===
    this.shopContainer = this.add.container(0, 0).setVisible(true);
    this.hiloContainer = this.add.container(0, 0).setVisible(false);
    this.coinFlipContainer = this.add.container(0, 0).setVisible(false);

    this.setupShop();
    this.setupHilo();
    this.setupCoinFlip();

    this.createRightNav();
  }

  addPressEffect(obj, pairedText = null, offset = 5) {
    obj.originalY = obj.y;
    if (pairedText && pairedText.originalY === undefined) {
      pairedText.originalY = pairedText.y;
    }

    obj.on('pointerdown', () => {
      // move down on press
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

  createRightNav() {
    this.navContainer = this.add.container(this.contentWidth, 0);

    const bg = this.add.rectangle(0, 0, this.navWidth, this.contentHeight, 0x222222, 0.9)
      .setOrigin(0, 0);
    this.navContainer.add(bg);

    const tabNames = ["Shop", "Hilo", "Coin Flip"];
    const containers = [this.shopContainer, this.hiloContainer, this.coinFlipContainer];

    tabNames.forEach((name, i) => {
      const btn = this.add.text(this.navWidth / 2, 150 + i * 80, name, {
        font: "bold 28px Brothers",
        backgroundColor: "#333",
        color: "#fff",
        padding: { x: 12, y: 6 },
        align: "center"
      })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          containers.forEach((c, idx) => c.setVisible(idx === i));
        });

      this.navContainer.add(btn);
    });
  }

  setupShop() {
    const panelWidth = this.contentWidth;
    const panelHeight = this.contentHeight;
    const startX = 20;
    const startY = 20;

    // Shop panel background
    const bg = this.add.rectangle(startX, startY, panelWidth - 40, panelHeight - 40, 0xffffff, 0.65)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this.shopContainer.add(bg);

    const scrollAreaHeight = panelHeight - 80;

    // Scrollable mask
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(startX + 10, startY + 10, panelWidth - 60, scrollAreaHeight);
    const mask = maskGraphics.createGeometryMask();

    // Scrollable content container (center aligned)
    const content = this.add.container(startX + panelWidth / 2, startY + scrollAreaHeight / 2);
    content.setMask(mask);
    this.shopContainer.add(content);

    // Grid setup
    const cols = 3;
    const rows = 3;
    const itemSize = 150;
    const spacing = 30;

    for (let i = 0; i < 9; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = (col - (cols - 1) / 2) * (itemSize + spacing);
      const y = (row - (rows - 1) / 2) * (itemSize + spacing);

      const itemContainer = this.add.container(x, y);

      // Background box
      const box = this.add.rectangle(0, 0, itemSize, itemSize, 0xdddddd)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0x000000);
      itemContainer.add(box);

      // Item image (use single key 'item' for now)
      const imgKey = `item${i + 1}`; // if you preload item1..item9, they'll be used; fallback to 'item' if not found
      const img = this.textures.exists(imgKey) ? this.add.image(0, -30, imgKey) : this.add.image(0, -30, 'item');
      img.setDisplaySize(80, 80).setOrigin(0.5);
      itemContainer.add(img);

      // Item name
      const name = this.add.text(0, 30, `Item ${i + 1}`, {
        font: "16px Brothers",
        color: "#000"
      }).setOrigin(0.5);
      itemContainer.add(name);

      // Price
      const price = this.add.text(0, 50, `$${(i + 1) * 10}`, {
        font: "14px Brothers",
        color: "#008800"
      }).setOrigin(0.5);
      itemContainer.add(price);

      // Buy button (full width inside box, bottom with 5px padding)
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
      });

      itemContainer.add(buyBtnBg);
      itemContainer.add(buyBtnText);

      content.add(itemContainer);
    }

    // Scroll with mouse wheel
    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (!this.shopContainer.visible) return;
      content.y -= deltaY * 0.5;
    });
  }

  setupHilo() {
    const panelWidth = this.contentWidth;
    const panelHeight = this.contentHeight;
    const startX = 20;
    const startY = 20;

    const bg = this.add.rectangle(startX, startY, panelWidth - 40, panelHeight - 40, 0xffffff, 0.65)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this.hiloContainer.add(bg);

    // inner content area
    const contentLeft = startX + 20;
    const contentTop = startY + 20;
    const contentW = panelWidth - 60;
    const contentH = panelHeight - 80;

    const centerX = contentLeft + contentW / 2;
    const centerY = contentTop + contentH / 2 - 30;

    const suits = ["diamonds", "clubs", "hearts", "spades"];
    const ranks = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];
    const indexToKey = (index) => {
      const suit = suits[Math.floor(index / 13)];
      const rank = ranks[index % 13];
      return `${rank}_of_${suit}`;
    };
    const getRandomIndex = () => Math.floor(Math.random() * 52);

    // === Card (start random) ===
    let currentIndex = getRandomIndex();
    const cardKey = indexToKey(currentIndex);
    const card = this.add.image(centerX, centerY, cardKey)
      .setOrigin(0.5);
    this.hiloContainer.add(card);

    // enforce fixed display size ratio
    const cardW = 160;
    const cardH = 240;
    const baseWidth = card.width;
    const baseHeight = card.height;
    const scaleX = cardW / baseWidth;
    const scaleY = cardH / baseHeight;
    card.setScale(scaleX, scaleY);

    // Skip button
    const skipY = centerY + 150;
    const skipBtn = this.add.rectangle(centerX, skipY, 120, 44, 0x6666aa)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const skipText = this.add.text(centerX, skipY, "Skip", {
      font: "20px Brothers",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.addPressEffect(skipBtn, skipText);
    this.hiloContainer.add([skipBtn, skipText]);

    // Odds table
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

    // Left / Right arrows + rate texts
    const arrowOffsetX = Math.min(220, contentW * 0.32);
    const arrowY = centerY;

    const leftRateStyle = { font: "bold 72px Brothers", color: "#ff4d4d", align: 'center' };
    const leftArrowImg = this.add.image(centerX - arrowOffsetX, arrowY, 'down_arrow')
      .setDisplaySize(68, 48)
      .setOrigin(0.5)
    const leftRateText = this.add.text(centerX - arrowOffsetX, arrowY - 70, '—', leftRateStyle).setOrigin(0.5);
    leftRateText.setStroke('#000000', 6);
    this.hiloContainer.add([leftArrowImg, leftRateText]);

    const rightRateStyle = { font: "bold 72px Brothers", color: "#33cc33", align: 'center' };
    const rightArrowImg = this.add.image(centerX + arrowOffsetX, arrowY, 'up_arrow')
      .setDisplaySize(68, 48)
      .setOrigin(0.5)
    const rightRateText = this.add.text(centerX + arrowOffsetX, arrowY - 70, '—', rightRateStyle).setOrigin(0.5);
    rightRateText.setStroke('#000000', 6);
    this.hiloContainer.add([rightArrowImg, rightRateText]);

    // === update rate text function ===
    const updateRates = (index) => {
      const rank = getRank(index);
      const ratio = cardRatios[rank];

      if (ratio.lower) {
        leftRateText.setText(ratio.lower.toFixed(2) + "x");
        leftRateText.setAlpha(1);
      } else {
        leftRateText.setText("—");
        leftRateText.setAlpha(0.5);
      }

      if (ratio.higher) {
        rightRateText.setText(ratio.higher.toFixed(2) + "x");
        rightRateText.setAlpha(1);
      } else {
        rightRateText.setText("—");
        rightRateText.setAlpha(0.5);
      }
    };

    updateRates(currentIndex);

    const revealCard = (newIndex, onComplete = null) => {
      if (this.isFlipping) return;
      this.isFlipping = true;

      upBtnImg.disableInteractive().setAlpha(0.5);
      downBtnImg.disableInteractive().setAlpha(0.5);

      const DESIRED_W = 160;
      const DESIRED_H = 240;

      this.tweens.killTweensOf(card);

      const getScalesForKey = (key) => {
        const tex = this.textures.get(key);
        let frameW = 1, frameH = 1;
        if (tex && tex.source && tex.source[0]) {
          frameW = tex.source[0].width;
          frameH = tex.source[0].height;
        } else if (card.frame) {
          frameW = card.frame.width;
          frameH = card.frame.height;
        }
        return { sx: DESIRED_W / frameW, sy: DESIRED_H / frameH };
      };

      this.tweens.add({
        targets: card,
        scaleX: 0,
        duration: 160,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          const backKey = 'card_back';
          const backScales = getScalesForKey(backKey);

          card.setTexture(backKey);
          card.setScale(0, backScales.sy);

          this.tweens.add({
            targets: card,
            scaleX: backScales.sx,
            duration: 160,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.time.delayedCall(180, () => {
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

    // skip button logic
    skipBtn.on('pointerdown', () => {
      let nextIndex = getRandomIndex();
      if (nextIndex === currentIndex && 52 > 1) {
        for (let i = 0; i < 6 && nextIndex === currentIndex; i++) {
          nextIndex = getRandomIndex();
        }
      }
      revealCard(nextIndex, () => {
        updateRates(currentIndex);
      });
    });

    // === Bet panel ===
    const betPanelHeight = 200;
    const betPanelX = contentLeft + contentW / 2 - 10;
    const betPanelY = contentTop + contentH - betPanelHeight / 2 + 10;

    const betBg = this.add.rectangle(betPanelX, betPanelY, contentW, betPanelHeight, 0x222222, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xffd700);
    this.hiloContainer.add(betBg);

    this.userBalance = (typeof this.balance === 'number') ? this.balance : (this.userBalance || 1000);
    const balanceText = this.add.text(betPanelX - 35, betPanelY - 70, `Balance: ${this.userBalance}`, {
      font: "20px Brothers",
      color: '#ffffff'
    }).setOrigin(0.5);
    this.hiloContainer.add(balanceText);

    this.hiloBetAmount = 0;
    const inputBg = this.add.rectangle(betPanelX - 35, betPanelY - 30, 280, 40, 0x000000)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xffffff);
    this.hiloContainer.add(inputBg);

    const betInput = this.add.text(betPanelX - 35, betPanelY - 30, this.hiloBetAmount.toString(), {
      font: "20px Brothers",
      color: '#fff'
    }).setOrigin(0.5);
    this.hiloContainer.add(betInput);

    // toggle group
    const betValues = [1, 5, 10, 50, 100];
    this.selectedStep = 1;
    const btnWidth = 70;
    const btnHeight = 36;
    const spacing = 15;
    const totalWidth = betValues.length * btnWidth + (betValues.length - 1) * spacing;
    const startBtnX = betPanelX - totalWidth / 2;
    const btnY = betPanelY + 25;
    this.hiloBetButtons = [];

    betValues.forEach((val, idx) => {
      const x = startBtnX + idx * (btnWidth + spacing);
      const b = this.add.rectangle(x, btnY, btnWidth, btnHeight, 0x555555)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });
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

    // plus / minus
    const minusBg = this.add.rectangle(betPanelX - 215, betPanelY - 30, 50, 40, 0x884444)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const minusText = this.add.text(betPanelX - 215, betPanelY - 30, "-", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);
    minusBg.on("pointerdown", () => {
      this.hiloBetAmount = Math.max(0, this.hiloBetAmount - this.selectedStep);
      betInput.setText(this.hiloBetAmount.toString());
      this.userBalance = Math.max(0, this.userBalance - this.selectedStep);
      balanceText.setText(`Balance: ${this.userBalance}`);
    });
    this.addPressEffect(minusBg, minusText);
    
    const plusBg = this.add.rectangle(betPanelX + 145, betPanelY - 30, 50, 40, 0x448844)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const plusText = this.add.text(betPanelX + 145, betPanelY - 30, "+", { font: "24px Brothers", color: "#fff" }).setOrigin(0.5);
    plusBg.on("pointerdown", () => {
      this.hiloBetAmount = Math.min(this.userBalance, this.hiloBetAmount + this.selectedStep);
      betInput.setText(this.hiloBetAmount.toString());
      this.userBalance = Math.max(0, this.userBalance - this.selectedStep);
      balanceText.setText(`Balance: ${this.userBalance}`);
    });
    this.addPressEffect(plusBg, plusText);

    this.hiloContainer.add([minusBg, minusText, plusBg, plusText]);

    // percent buttons
    const percents = [0, 25, 50, 75, 100];
    const quickStartX = betPanelX - totalWidth / 2;
    const quickY = betPanelY + 70;

    this.hiloPercentButtons = [];
    percents.forEach((p, idx) => {
      const px = quickStartX + idx * 85;
      const pBg = this.add.rectangle(px, quickY, 70, 32, 0x444444)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const label = p === 0 ? "Clear" : `${p}%`;
      const pText = this.add.text(px, quickY, label, { font: "16px Brothers", color: '#fff' }).setOrigin(0.5);
      pBg.on('pointerdown', () => {
        const availableBalance = this.userBalance + this.hiloBetAmount;
        this.hiloBetAmount = p === 0 ? 0 : availableBalance * (p / 100);
        betInput.setText(currency.format(this.hiloBetAmount));
        this.userBalance = availableBalance - this.hiloBetAmount;
        balanceText.setText(`Balance: ${currency.format(this.userBalance)}`);
      });

      this.addPressEffect(pBg, pText);
      this.hiloContainer.add([pBg, pText]);

      this.hiloPercentButtons.push(pBg);
    });

    // === Higher / Lower buttons ===
    const upBtnImg = this.add.image(betPanelX + contentW / 4 + 200, betPanelY - 50, 'bet_higher')
      .setOrigin(0.5)
      .setDisplaySize(158, 69)
      .setInteractive({ useHandCursor: true });
    this.addPressEffect(upBtnImg);
    upBtnImg.on('pointerdown', () => startRound(true));

    const downBtnImg = this.add.image(betPanelX + contentW / 4, betPanelY - 50, 'bet_lower')
      .setOrigin(0.5)
      .setDisplaySize(158, 69)
      .setInteractive({ useHandCursor: true });
    this.addPressEffect(downBtnImg);
    downBtnImg.on('pointerdown', () => startRound(false));

    // === Cashout button ===
    this.prizePool = 0;

    const cashoutBg = this.add.rectangle(
      betPanelX + contentW / 4 + 100, // center under the 2 buttons
      betPanelY + 60,
      280,
      40,
      0x000000
    ).setOrigin(0.5).setStrokeStyle(2, 0xffffff);

    this.cashoutText = this.add.text(
      cashoutBg.x,
      cashoutBg.y,
      "Cashout",
      {
        font: "20px Brothers",
        color: '#888888' // disabled by default
      }
    ).setOrigin(0.5);

    this.addPressEffect(cashoutBg, this.cashoutText);
    this.cashoutEnabled = false;

    // helper to update state
    this.updateCashoutButton = () => {
      if (this.prizePool > 0) {
        this.cashoutText.setText(`Cashout $${this.prizePool}`);
        this.cashoutText.setColor('#FFD700');
        this.cashoutEnabled = true;

        cashoutBg.setInteractive({ useHandCursor: true });
      } else {
        this.cashoutText.setText("Cashout");
        this.cashoutText.setColor('#888888');
        this.cashoutEnabled = false;

        cashoutBg.disableInteractive();
      }
    };

    // click handler
    cashoutBg.on('pointerdown', () => {
      if (!this.cashoutEnabled) return;

      this.userBalance += this.prizePool;
      balanceText.setText(`Balance: ${this.userBalance}`);
      if (typeof balanceText !== 'undefined') {
        balanceText.setText(`Balance: ${this.userBalance}`);
      }

      if (!this.sound.locked) {
        this.sound.play('ka-chingSound', { volume: 1 });
      } else {
        this.sound.once('unlocked', () => {
          this.sound.play('ka-chingSound', { volume: 1 });
        });
      }

      this.prizePool = 0;
      this.updateCashoutButton();

      this.hiloGameStarted = false;

      skipBtn.setVisible(true);
      skipText.setVisible(true);

      this.hiloBetButtons.forEach(b => b.bg.setInteractive({ useHandCursor: true }).setFillStyle(0x555555));
      plusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
      minusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
      this.hiloPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));
      betInput.setColor('#ffffff');
    });

    // init state
    this.updateCashoutButton();

    this.hiloContainer.add([upBtnImg, downBtnImg, cashoutBg, this.cashoutText]);

    // Start Round
    const startRound = (isHigher) => {
      if(this.hiloBetAmount == 0) return;

      if (!this.hiloGameStarted) {
        skipBtn.setVisible(false);
        skipText.setVisible(false);

        this.hiloBetButtons.forEach(b => {
          b.bg.disableInteractive().setFillStyle(0x333333);
          b.label.setColor('#888888');
        });
        plusBg.disableInteractive().setFillStyle(0x333333);
        minusBg.disableInteractive().setFillStyle(0x333333);
        this.hiloPercentButtons.forEach(pBg => pBg.disableInteractive().setFillStyle(0x333333));

        betInput.setColor('#888888');

        this.hiloGameStarted = true;
      }

      const currentRank = currentIndex % 13;
      let nextIndex = getRandomIndex();
      while (nextIndex === currentIndex && 52 > 1) nextIndex = getRandomIndex();
      const nextRank = nextIndex % 13;

      const userWin = (isHigher && nextRank > currentRank) || (!isHigher && nextRank < currentRank);

      revealCard(nextIndex, () => {
        updateRates(currentIndex);
      });
      card.setTexture(indexToKey(currentIndex));

        if (userWin) {
          if (!this.sound.locked) {
            this.sound.play('winSound', { volume: 1 });
          } else {
            this.sound.once('unlocked', () => {
              this.sound.play('winSound', { volume: 1 });
            });
          }
          const ratio = isHigher ? cardRatios[currentRank].higher : cardRatios[currentRank].lower;
          
          if (!ratio) {
            this.prizePool = 0;
            this.updateCashoutButton();
          } else {
            const winAmount = parseFloat((this.hiloBetAmount * ratio).toFixed(2));
            this.prizePool = parseFloat((this.prizePool + winAmount).toFixed(2));

            this.updateCashoutButton();
          }
        } else {
          if (!this.sound.locked) {
            this.sound.play('loseSound', { volume: 1 });
          } else {
            this.sound.once('unlocked', () => {
              this.sound.play('loseSound', { volume: 1 });
            });
          }
          this.prizePool = 0;
          this.updateCashoutButton();
          this.hiloGameStarted = false;

          skipBtn.setVisible(true);
          skipText.setVisible(true);

          this.hiloBetButtons.forEach(b => {
            b.bg.setInteractive({ useHandCursor: true }).setFillStyle(0x555555);
            b.label.setColor('#ffffff');
          });
          plusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x448844);
          minusBg.setInteractive({ useHandCursor: true }).setFillStyle(0x884444);
          this.hiloPercentButtons.forEach(pBg => pBg.setInteractive({ useHandCursor: true }).setFillStyle(0x444444));

          betInput.setColor('#ffffff');
        }
    };

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
    const text = this.add.text(this.contentWidth / 2, this.contentHeight / 2, "COIN FLIP", {
      font: "32px Brothers",
      color: "#fff"
    }).setOrigin(0.5);
    this.coinFlipContainer.add(text);
  }
}
