export default class HomeScene extends Phaser.Scene {
    constructor() {
      super({ key: 'HomeScene' });
      this.loading = null;
    }
  
  preload() {
    this.load.image('background2', 'assets/images/background2.png');
    this.load.image('logo', 'assets/images/logo.png');
    this.load.image('tapToBegin', 'assets/images/tap-to-begin.png');
    this.load.image('loading', 'assets/images/loading-icon.png');
    this.load.image('overlay', 'assets/images/overlay.png');
  }    create() {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      
      let overlay = this.add.image(centerX, centerY, 'overlay')
      .setDisplaySize(1920, 1080)
      .setOrigin(0.5)
      .setDepth(1)
      .setVisible(false);
  
      this.loading = this.add.image(centerX, centerY, 'loading').setDisplaySize(240, 240).setDepth(2).setVisible(false);
      this.add.image(centerX, centerY, 'background2').setDisplaySize(1920, 1080);
      this.add.image(centerX, centerY-150, 'logo').setDisplaySize(416, 224).setDepth(1);
  
      let startGameButton = this.add.image(centerX, centerY, 'tapToBegin').setDisplaySize(1920, 1080).setInteractive();
      startGameButton.on('pointerup', () => {
        // this.scale.startFullscreen();
        this.loading.setVisible(true);
        overlay.setVisible(true);
        this.startGame();
      });
  
      this.tweens.add({
        targets: startGameButton,
        alpha: { from: 1, to: 0 },
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  
    update()
    {
      this.loading.angle += 2.25; 
    }
  
    async startGame() {
      let user_id = 1;
      let username = "test";
      let balance = 1000;
      let token = "token";
      
      this.scene.start('GameScene', { user_id, username, balance, token});
      
    //   let token = localStorage.getItem("token") || 0;
      
    //   await axios.post("https://game-api.j4u.app/getUser", {}, {
    //     headers: {
    //       authorization: `Bearer ${token}`
    //     }
    //   })
    //   .then(response => {
    //     if(!response.data.status)
    //     {
    //       return alert(response.data.message);
    //     }
  
    //     let user_id = response.data.data.user_id;
    //     let username = response.data.data.username;
    //     let balance = response.data.data.balance;
    //     this.scene.start('GameScene', { user_id, username, balance, token});
    //   })
    // }
  }
}