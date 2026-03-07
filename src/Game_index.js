import Gamebackground from './scenes/Gamebackground';
import Phaser, { Physics } from 'phaser';
import TitleScreen from './scenes/TitleScreen';
import Game from './scenes/Game';
import GameOver from './scenes/GameOver';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game-container',
    
    // --- UPDATED: Using ScaleManager for proper canvas sizing ---
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1000,
        height: 500
    },
    
    // Forcing a minimum resolution of 2 for crisp text ---
    resolution: Math.max(window.devicePixelRatio, 2),
    roundPixels: false,
    antialias: true,
    antialiasGL: true,
    // backgroundColor: '#ce4d4d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

game.scene.add('gamebackground', Gamebackground);
game.scene.add('game', Game);
game.scene.add('titlescreen', TitleScreen);
game.scene.add('gameover', GameOver);


game.scene.start('titlescreen');