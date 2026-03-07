import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('gameover');
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        const { width, height } = this.scale;

        // 1. Add a dark, semi-transparent background overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);

        // 2. Add the Game Over text with Fantasy RPG styling
        const gameOverText = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
            fontSize: '84px',
            fontFamily: 'Georgia, "Times New Roman", serif', // Swapped Poppins for a classic serif
            fontWeight: 'bold',
            stroke: '#362f29', // Dark, earthy brown outline
            strokeThickness: 16, // Extra thick stroke
            shadow: { 
                offsetX: 0, 
                offsetY: 8, 
                color: '#0a0a0a', 
                blur: 4, 
                stroke: true, 
                fill: true 
            }
        }).setOrigin(0.5);

        // 3. Apply a top-to-bottom gradient to make it look carved/textured
        const gradient = gameOverText.context.createLinearGradient(0, 0, 0, gameOverText.height);
        gradient.addColorStop(0, '#f4ebd8');   // Light parchment/bone color at the top
        gradient.addColorStop(0.4, '#c3b199'); // Warmer tan in the middle
        gradient.addColorStop(1, '#7a6a58');   // Darker stone brown at the bottom
        
        gameOverText.setFill(gradient);

        // 4. Create a "Reset Level" button that matches the new theme
        const restartBtn = this.add.text(width / 2, height / 2 + 100, 'RESET LEVEL', {
            fontSize: '28px',
            fill: '#f4ebd8', // Light parchment text
            backgroundColor: '#362f29', // Dark stone background
            padding: { left: 25, right: 25, top: 15, bottom: 15 },
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Add hover effects for the button (lightens up when hovered)
        restartBtn.on('pointerover', () => {
            restartBtn.setStyle({ fill: '#ffffff', backgroundColor: '#7a6a58' });
        });
        
        restartBtn.on('pointerout', () => {
            restartBtn.setStyle({ fill: '#f4ebd8', backgroundColor: '#362f29' });
        });

        // 5. Restart the game when clicked
        restartBtn.on('pointerdown', () => {
            this.scene.start('game'); // Jumps straight back into the action!
        });
    }
}