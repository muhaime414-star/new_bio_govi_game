import Phaser from 'phaser';

export default class Gamebackground extends Phaser.Scene {
    constructor() {
        super('gamebackground');
    }

    // WE REMOVED PRELOAD() COMPLETELY
    // TitleScreen.js already loaded these into global memory for us!

    create() {
        const { width, height } = this.scale;

        // Start with Level 1 background
        this.bg = this.add.tileSprite(0, 0, width, height, 'bg1');
        this.bg.setOrigin(0, 0);
        this.bg.setScrollFactor(0);

        // Dynamically scale based on bg1
        const img = this.textures.get('bg1').getSourceImage();
        const scale = height / img.height;
        this.bg.setTileScale(scale, scale);
    }

    changeBackground(textureKey) {
        if (this.textures.exists(textureKey)) {
            this.bg.setTexture(textureKey);

            const img = this.textures.get(textureKey).getSourceImage();
            const scale = this.scale.height / img.height;
            this.bg.setTileScale(scale, scale);
        } else {
            console.warn(`Texture '${textureKey}' not found. Make sure it is loaded in preload()!`);
        }
    }

    update() {
        const gameScene = this.scene.get('game');
        if (gameScene && gameScene.cameras && gameScene.cameras.main) {
            this.bg.tilePositionX = gameScene.cameras.main.scrollX * 0.3;
        }
    }
}