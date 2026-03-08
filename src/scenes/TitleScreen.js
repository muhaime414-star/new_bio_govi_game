import Phaser from 'phaser';

// --- EXISTING IMPORTS ---
import bg1Image from 'url:./Game_assets/lv1_background.png'; 
import bg2Image from 'url:./Game_assets/lv2_background.png'; 
import bg3Image from 'url:./Game_assets/lv3_background.png'; 
import bookImg from 'url:./Game_assets/magical_book.png'; 
import portal from 'url:./Game_assets/portal.png';
import toxic_tar from 'url:./Game_assets/toxic_tar.png';
import dnaImg from 'url:./Game_assets/dna_coin.png';
import heartFullImg from 'url:./Game_assets/heart_full.png';
import heartHalfImg from 'url:./Game_assets/heart_half.png';
import heartEmptyImg from 'url:./Game_assets/heart_empty.png';
import bgMusic from 'url:./Game_assets/background_music.mp3';
import muteOffImg from 'url:./Game_assets/mute_off_butt.png';
import muteOnImg from 'url:./Game_assets/mute_on_butt.png';
import jumpSfxFile from 'url:./Game_assets/jump.mp3';
import enemy_spritesheet from 'url:./Game_assets/enemy_spritesheet.png';
import damageSfxFile from 'url:./Game_assets/damage.mp3';
import ancientSageImg from 'url:./Game_assets/ancient_sage.png'; 

// --- NEW AVATAR IMPORTS ---
// We import all of them so Parcel knows to bundle them into your game!
import avatar01 from 'url:../web_assets/avatars/avatar_01_sprite.png';
import avatar02 from 'url:../web_assets/avatars/avatar_02_sprite.png';
import avatar03 from 'url:../web_assets/avatars/avatar_03_sprite.png';
import avatar04 from 'url:../web_assets/avatars/avatar_04_sprite.png';
import avatar05 from 'url:../web_assets/avatars/avatar_05_sprite.png';
import avatar06 from 'url:../web_assets/avatars/avatar_06_sprite.png';
import avatar07 from 'url:../web_assets/avatars/avatar_07_sprite.png';
import avatar08 from 'url:../web_assets/avatars/avatar_08_sprite.png';
import avatar09 from 'url:../web_assets/avatars/avatar_09_sprite.png';
import avatar11 from 'url:../web_assets/avatars/avatar_11_sprite.png';
import avatar12 from 'url:../web_assets/avatars/avatar_12_sprite.png';
import avatar13 from 'url:../web_assets/avatars/avatar_13_sprite.png';
import avatar14 from 'url:../web_assets/avatars/avatar_14_sprite.png';

// Create a dictionary map to easily find the right file based on ID
const avatarSprites = {
    1: avatar01, 2: avatar02, 3: avatar03, 4: avatar04, 5: avatar05,
    6: avatar06, 7: avatar07, 8: avatar08, 9: avatar09, 11: avatar11,
    12: avatar12, 13: avatar13, 14: avatar14
};


export default class TitleScreen extends Phaser.Scene {
    constructor() {
        super('titlescreen');
    }

    preload() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#1a4321');

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        
        progressBox.fillStyle(0x000000, 0.6); 
        progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 15);
        progressBox.lineStyle(4, 0xffffff, 1); 
        progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 15);

        const loadingText = this.add.text(width / 2, height / 2 - 70, 'Loading ...', {
            fontFamily: 'Georgia, "Times New Roman", serif', 
            fontSize: '32px',
            fill: '#f4ebd8',
            fontWeight: 'bold',
            stroke: '#362f29',
            strokeThickness: 5
        }).setOrigin(0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '22px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        percentText.setDepth(1);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x4ade80, 1); 
            progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load existing assets
        this.load.image('bg1', bg1Image);
        this.load.image('bg2', bg2Image);
        this.load.image('bg3', bg3Image);
        this.load.image('magical_book', bookImg);
        this.load.image('portal', portal);
        this.load.image('toxic_tar', toxic_tar);
        this.load.image('dna_coin', dnaImg); 
        this.load.image('heart_full', heartFullImg);
        this.load.image('heart_half', heartHalfImg);
        this.load.image('heart_empty', heartEmptyImg); 
        this.load.image('mute_off', muteOffImg);
        this.load.image('mute_on', muteOnImg);  
        this.load.audio('bgm', bgMusic); 
        this.load.audio('jump_sfx', jumpSfxFile);
        this.load.audio('damage_sfx', damageSfxFile);
        this.load.spritesheet('enemy_spritesheet', enemy_spritesheet, { frameWidth: 400, frameHeight: 400 });
        this.load.image('ancient_sage', ancientSageImg);

        // --- NEW: DYNAMIC PLAYER SPRITE LOADING ---
        // Get the saved ID from the dashboard, default to 1 if not found
        const savedAvatarId = localStorage.getItem('studentAvatarId') || 1;
        const selectedSpriteFile = avatarSprites[savedAvatarId] || avatarSprites[1];

        // ONE SINGLE FRAME of your new character animations!
        this.load.spritesheet('player_sprite', selectedSpriteFile, { frameWidth: 170, frameHeight: 369 });
        // this.load.spritesheet('player_sprite', selectedSpriteFile, { frameWidth: 178, frameHeight: 369 });
    }

    create() {
        const { width, height } = this.scale;
        
        const bg = this.add.image(0, 0, 'bg1').setOrigin(0, 0);
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        const titleText = this.add.text(width / 2, height / 3 - 20, 'QUEST FOR KNOWLEDGE', { 
            fontSize: '64px', 
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 'bold',
            stroke: '#362f29',
            strokeThickness: 16,
            shadow: { offsetX: 0, offsetY: 8, color: '#0a0a0a', blur: 4, stroke: true, fill: true },
            resolution: 3
        }).setOrigin(0.5);

        const gradient = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        gradient.addColorStop(0, '#f4ebd8');   
        gradient.addColorStop(0.4, '#c3b199'); 
        gradient.addColorStop(1, '#7a6a58');   
        titleText.setFill(gradient);

        // --- NEW: MEET THE SAGE LINK ---
        const sageLink = this.add.text(width / 2, height / 2 + 10, '- Meet Our Old Sage -', { 
            fontSize: '22px', 
            fill: '#c3b199', // Matches the middle of your title gradient
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Hover effect for the link
        sageLink.on('pointerover', () => {
            sageLink.setStyle({ fill: '#ffffff' });
        });
        
        sageLink.on('pointerout', () => {
            sageLink.setStyle({ fill: '#c3b199' });
        });

        // Click action for the link
        sageLink.once('pointerdown', () => {
            this.scene.stop('titlescreen'); 
            // Replace 'sage_scene' with the actual key of your sage/tutorial scene
            this.scene.start('sage_scene'); 
        });
        // --------------------------------

        const startBtn = this.add.text(width / 2, height / 2 + 80, 'START GAME', { 
            fontSize: '28px', 
            fill: '#f4ebd8', 
            backgroundColor: '#362f29',
            padding: { left: 30, right: 30, top: 15, bottom: 15 },
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: startBtn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        startBtn.on('pointerover', () => {
            startBtn.setStyle({ fill: '#ffffff', backgroundColor: '#7a6a58' });
        });
        
        startBtn.on('pointerout', () => {
            startBtn.setStyle({ fill: '#f4ebd8', backgroundColor: '#362f29' });
        });

        startBtn.once('pointerdown', () => {
            this.scene.stop('titlescreen'); 
            this.scene.start('game');
        });
    }
}