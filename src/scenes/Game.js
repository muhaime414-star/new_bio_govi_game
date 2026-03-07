import Phaser from 'phaser';

import questionData from './Game_assets/questions.json';


export default class Game extends Phaser.Scene {
    preload() {
       
   
    }



    
    create() {
    // 1. Launch Background and Sound
    this.scene.launch('gamebackground');
    
    this.music = this.sound.add('bgm', {
        volume: 0.1, 
        loop: true   
    });
    this.music.play();

    this.jumpSound = this.sound.add('jump_sfx', { volume: 0.1 });
    this.damageSound = this.sound.add('damage_sfx', { volume: 0.3 });

    // 2. CHAPTER FILTERING LOGIC
    // Retrieve the selection from game_chose_page.html
    const selectedChapter = localStorage.getItem('selectedChapter') || 'Chapter 4';

    // Filter questions based on the selected chapter (or 'All' for everything)
    let filteredQuestions;
    if (selectedChapter === 'All') {
        filteredQuestions = questionData; 
    } else {
        filteredQuestions = questionData.filter(q => q.Chapter === selectedChapter);
    }

    // 3. Initialize Game State
    this.isQuizOpen = false;
    this.isInvincible = false;
    this.hearts = 3.0;
    this.maxHearts = 3;
    this.jumps = 0;
    this.xp = 0;
    this.currentLevel = 1;
    this.wrongAttempts = 0;
    this.levelMistakes = 0;

    // 4. Organize Question Pools based on the Filtered List
    this.pools = {
        1: filteredQuestions.filter(q => q.Level === "Level 1"),
        2: filteredQuestions.filter(q => q.Level === "Level 2"),
        3: filteredQuestions.filter(q => q.Level === "Level 3")
    };

    // 5. Physics World & Ground Setup
    const width = 20000;
    const height = 500;
    this.physics.world.setBounds(0, 0, width, height);

    this.ground = this.add.rectangle(width / 2, 385, width, 30, 0x00ff00, 0); 
    this.physics.add.existing(this.ground, true); 

    // 6. Animations and Player Setup
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player_sprite', { start: 0, end: 3}),
        frameRate: 12,
        repeat: -1
    });

    this.player = this.physics.add.sprite(100, 300, 'player_sprite').setScale(0.3);
    this.player.setCollideWorldBounds(true);
    // this.player.body.setSize(this.player.width * 0.45, this.player.height * 0.4);
    // this.player.body.setOffset(this.player.width * 0.28, this.player.height * 0.1);


    // this.player.body.setSize(this.player.width * 0.45, this.player.height * 0.4); 
    // this.player.body.setOffset(this.player.width * 0.28, this.player.height * 0.7); 

    this.player.body.setSize(this.player.width * 0.4, this.player.height * 0.8); 
    this.player.body.setOffset(this.player.width * 0.3, this.player.height * 0.2);
    
    this.physics.add.collider(this.player, this.ground);

    // 7. Camera and Input
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 8. HUD & UI Styling
    const hudStyle = { 
        fontSize: '24px', 
        fill: '#ffffff', 
        fontWeight: '700', 
        fontFamily: '"Poppins", sans-serif', 
        stroke: '#1a3b22', 
        strokeThickness: 4, 
        resolution: 3 
    };

    this.heartIcons = []; 
    for (let i = 0; i < this.maxHearts; i++) {
        let heart = this.add.image(40 + (i * 40), 30, 'heart_full').setScrollFactor(0).setScale(0.1);
        this.heartIcons.push(heart);
    }

    this.xpText = this.add.text(800, 20, '🧬 XP: 0', hudStyle).setScrollFactor(0);
    this.levelText = this.add.text(450, 20, 'LEVEL 1', hudStyle).setScrollFactor(0).setOrigin(0.5, 0);

    // 9. Mute Button Logic
    const initialMuteIcon = this.sound.mute ? 'mute_on' : 'mute_off'; 
    this.muteBtn = this.add.image(960, 34, initialMuteIcon)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .setScale(0.06);

    this.muteBtn.on('pointerover', () => this.muteBtn.setAlpha(0.8));
    this.muteBtn.on('pointerout', () => this.muteBtn.setAlpha(1));
    this.muteBtn.on('pointerdown', () => {
        this.sound.mute = !this.sound.mute;
        this.muteBtn.setTexture(this.sound.mute ? 'mute_on' : 'mute_off');
    });

    // 10. Physics Groups & Handlers
    this.hazards = this.physics.add.group();
    this.physics.add.overlap(this.player, this.hazards, this.hitHazard, null, this);

    this.portals = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.portals, this.hitPortal, null, this);

    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem, null, this);

    this.staticHearts = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.staticHearts, this.collectStaticHeart, null, this);
    this.physics.add.collider(this.staticHearts, this.ground, this.heartHitGround, null, this);

    this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // 11. Final Initialization
    this.spawnShrine(600);
    
    this.events.on('shutdown', () => {
        this.scene.stop('gamebackground');
    });
}
    
    spawnShrine(xPosition) {

        // 1. Spawn the Shrine (Magical Book)
        const newShrine = this.physics.add.sprite(xPosition, 300, 'magical_book');
        newShrine.setScale(0.4); 
        newShrine.body.setAllowGravity(false); 
        newShrine.body.setImmovable(true);
        newShrine.body.setSize(newShrine.width * 0.6, newShrine.height * 0.8);
        newShrine.body.setOffset(newShrine.width * 0.2, newShrine.height * 0.2);

        // newShrine.body.setSize(newShrine.width * 0.3, newShrine.height * 0.5);
        // newShrine.body.setOffset(newShrine.width * 0.35, newShrine.height * 0.25);

        this.physics.add.overlap(this.player, newShrine, this.hitShrine, null, this);

        const numHazards = Phaser.Math.Between(1, 3);
        const startX = this.player.x + 250; 
        const endX = xPosition - 250;       

        const segmentWidth = (endX - startX) / numHazards;

        for (let i = 0; i < numHazards; i++) {
            const segmentStart = startX + (i * segmentWidth);
            const segmentEnd = segmentStart + segmentWidth;
            
            const randomX = Phaser.Math.Between(segmentStart + 50, segmentEnd - 50);
            
            this.spawnHazard(randomX);

            
        }



        let numItems;
        switch(this.currentLevel) {
            case 1: numItems = Phaser.Math.Between(6, 8); break; // Lots of coins for Level 1
            case 2: numItems = Phaser.Math.Between(4, 6); break; // Medium amount for Level 2
            case 3: numItems = Phaser.Math.Between(3, 4); break; // Very scarce for Level 3!
            default: numItems = 4;
        }
        const itemStartX = this.player.x + 300; 
        const itemEndX = xPosition - 300;
        const spacing = (itemEndX - itemStartX) / numItems;

        for (let i = 0; i < numItems; i++) {
            const itemX = itemStartX + (i * spacing);
            
            const heights = [150, 220, 330]; 
            let itemY = Phaser.Math.RND.pick(heights);

            if (itemY === 330) {
                let isTooCloseToTar = false;
                
                const safeDistance = 80; 

                this.hazards.getChildren().forEach(hazard => {
                    if (Math.abs(itemX - hazard.x) < safeDistance) {
                        isTooCloseToTar = true;
                    }
                });

                if (isTooCloseToTar) {
                    itemY = 220; 
                }
            }

            const item = this.collectibles.create(itemX, itemY, 'dna_coin');


            item.setScale(0.15); // Adjust scale based on your image size

            this.tweens.add({
                targets: item,
                y: item.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        if (Phaser.Math.Between(1, 100) <= 25) {
            const heartX = Phaser.Math.Between(itemStartX, itemEndX);
            const heartY = Phaser.Math.Between(150, 220); // Floating high up

            const isFull = Phaser.Math.Between(1, 100) <= 30;
            const texture = isFull ? 'heart_full' : 'heart_half';

            const heart = this.staticHearts.create(heartX, heartY, texture);
            heart.setScale(0.1); // Adjust scale based on your image
            heart.healValue = isFull ? 1.0 : 0.5;

            this.tweens.add({
                targets: heart,
                y: heart.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        if (this.currentLevel === 3) {
            const enemyX = Phaser.Math.Between(this.player.x + 300, xPosition - 300);
            this.spawnEnemy(enemyX);
        }

    
    
    
    }

    spawnPortal(xPosition) {
        if (this.portals.getLength() > 0) return; 

        const portal = this.portals.create(xPosition, 280, 'portal');
        portal.setScale(0.5); 
    }



    spawnHazard(xPosition) {
    // Moved Y from 330 to 360 to sink it into the grass line
    const hazard = this.hazards.create(xPosition, 340, 'toxic_tar');
    hazard.setScale(0.15); 
    
    hazard.body.setAllowGravity(false);
    hazard.body.setImmovable(true);
    
    // Make the hitbox very flat (0.3 height) so players can jump over it more fairly
    hazard.body.setSize(hazard.width * 0.6, hazard.height * 0.4);
    hazard.body.setOffset(hazard.width * 0.25, hazard.height * 0.5);
}
    
    spawnEnemy(xPosition) {
        // 1. Create the enemy sprite
        const enemy = this.enemies.create(xPosition, 310, 'enemy_spritesheet');
        enemy.setScale(0.15); 
        enemy.setFrame(0);
        enemy.body.setSize(enemy.width * 0.7, enemy.height * 0.7);

        // 2. Add the Patrol Tween (Assigned to a variable so we can control it)
        const patrolTween = this.tweens.add({
            targets: enemy,
            x: enemy.x + 150, 
            duration: 1000,   
            yoyo: true,       
            repeat: -1,       
            ease: 'Sine.easeInOut',
            onYoyo: () => { enemy.flipX = true; },
            onRepeat: () => { enemy.flipX = false; }
        });

        

        // 3. Advanced AI Logic: The Chase Sequence
        enemy.smileTimer = this.time.addEvent({
            delay: 50, // This delay is fine for checking distance, but NOT for moving!
            callback: () => {
                if (!enemy || !enemy.active) return;

                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

                if (distance < 250) {
                    // PLAYER DETECTED: Pause patrol and CHASE!
                    if (patrolTween.isPlaying()) patrolTween.pause();
                    
                    if (enemy.frame.name !== 1) {
                        enemy.setFrame(1); // Switch to the aggressive frame
                    }
                    
                    // FIX: Use physics velocity for buttery smooth 60fps movement
                    if (this.player.x < enemy.x) {
                        enemy.setVelocityX(-90); // Slide left smoothly
                        enemy.flipX = true;
                    } else {
                        enemy.setVelocityX(90); // Slide right smoothly
                        enemy.flipX = false;
                    }
                } else {
                    // PLAYER LOST: Resume normal patrol
                    enemy.setVelocityX(0); // FIX: Kill the chase momentum before resuming patrol
                    
                    if (patrolTween.isPaused()) patrolTween.resume();
                    
                    if (enemy.frame.name !== 0) {
                        enemy.setFrame(0); // Relaxed face
                    }
                }
            },
            callbackScope: this,
            loop: true
        });

        // 4. Memory Management
        enemy.on('destroy', () => {
            if (enemy.smileTimer) {
                enemy.smileTimer.remove();
            }
        });
    }
    
    
    hitHazard(player, hazard) {
        // 1. Check if already hit or answering a quiz
        if (this.isInvincible || this.isQuizOpen) return;

        // 2. Make player invincible temporarily
        this.isInvincible = true;

        // 3. Apply damage and update UI
        this.hearts -= 0.5;
        this.updateHeartsUI();

        // 4. Play effects (Sound, Tint, Camera Shake)
        this.damageSound.play(); 
        this.player.setTint(0xff0000); 
        this.cameras.main.shake(150, 0.01);

        // 5. Check for Game Over
        if (this.hearts <= 0) {
            this.music.stop();
            
            // Fade to black over 500ms
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            // Wait for the fade to finish before switching scenes
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.stop('gamebackground');
                this.scene.start('gameover'); 
            });
            return;
        }
    
        // 6. Remove the red tint and invincibility after 1.5 seconds
        this.time.delayedCall(1500, () => {
            // Safety check: Don't run if the player died and the object was destroyed
            if (!this.player || !this.player.active) return; 
            this.player.clearTint();
            this.isInvincible = false;
        });
    }

    hitEnemy(player, enemy) {
        if (this.isInvincible || this.isQuizOpen) return;

        const isStomping = player.body.velocity.y > 0 && player.y < enemy.y - 15;

        if (isStomping) {
            // --- VICTORY: STOMPED THE VIRUS ---
            player.setVelocityY(-350); // Bounce the player back up
            this.jumpSound.play();     

            enemy.body.enable = false; // Turn off physics immediately
            if (enemy.smileTimer) enemy.smileTimer.remove(); 

            this.tweens.add({
                targets: enemy,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => enemy.destroy()
            });

            // Reward XP for defeating the infection
            this.xp += 5;
            this.xpText.setText('🧬 XP: ' + this.xp);

            // Floating text reward
            const floatText = this.add.text(enemy.x, enemy.y - 20, '+5 XP', {
                fontSize: '20px', fill: '#FFD700', fontFamily: '"Poppins", sans-serif',
                fontWeight: 'bold', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5);
            
            this.tweens.add({ 
                targets: floatText, y: enemy.y - 70, alpha: 0, duration: 800, 
                onComplete: () => floatText.destroy() 
            });

        } else {
            // --- DEFEAT: TOOK DAMAGE ---
            this.isInvincible = true;
            this.hearts -= 0.5;
            this.updateHeartsUI();
            this.damageSound.play();
            this.cameras.main.shake(150, 0.01);
            player.setTint(0xff0000);

            // KNOCKBACK: Push player away based on collision side
            const pushDirection = player.x < enemy.x ? -300 : 300;
            player.setVelocityX(pushDirection);
            player.setVelocityY(-200); // Slight pop upward

            if (this.hearts <= 0) {
                this.music.stop();
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.stop('gamebackground');
                    this.scene.start('gameover'); 
                });
                return;
            }
            
            this.time.delayedCall(1500, () => {
            // Safety check: Don't run if the player died and the object was destroyed
            if (!this.player || !this.player.active) return; 
            this.player.clearTint();
            this.isInvincible = false;
        });
        }
    }

    collectItem(player, item) {
        // item.disableBody(true, true);
        item.body.enable = false;
        this.tweens.add({
            targets: item,
            scale: item.scaleX * 1.5, // Scale up by 50%
            alpha: 0,                 // Fade to transparent
            duration: 300,            // Fast 300ms pop
            ease: 'Back.easeOut',     // Gives it a slight bouncy feel
            onComplete: () => {
                item.destroy();       // Clean up after animation
            }
        });

        // 2. Increase XP by 1 (or whatever value you want)
        this.xp += 1;
        this.xpText.setText('🧬 XP: ' + this.xp);

        // 3. Visual Polish: Create a floating "+1" text exactly where the item was
        const floatText = this.add.text(item.x, item.y, '+1', {
            fontSize: '24px',
            fill: '#2e8b57', // A nice green color
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 4. Animate the text floating up and fading out
        this.tweens.add({
            targets: floatText,
            y: item.y - 50,      // Move it 50 pixels up
            alpha: 0,            // Fade to transparent
            duration: 800,       // Takes 0.8 seconds
            onComplete: () => {
                floatText.destroy(); // Clean it up so it doesn't cause lag
            }
        });
    }

    collectStaticHeart(player, heart) {
        // Safely and instantly remove it from the screen
        heart.disableBody(true, true);
        heart.destroy();


        const healAmount = heart.healValue;

        // Add health and cap it at maxHearts
        this.hearts += healAmount;
        if (this.hearts > this.maxHearts) {
            this.hearts = this.maxHearts;
        }

        this.updateHeartsUI();

        // Floating text to show HP gained
        const floatText = this.add.text(heart.x, heart.y, '+' + healAmount + ' HP', {
            fontSize: '20px', fill: '#ff4d4d', fontFamily: '"Poppins", sans-serif',
            fontWeight: 'bold', stroke: '#ffffff', strokeThickness: 3
        }).setOrigin(0.5);

        // Animate the text floating up and fading out
        this.tweens.add({
            targets: floatText, y: heart.y - 50, alpha: 0, duration: 1000,
            onComplete: () => floatText.destroy()
        });
    }

    hitShrine(player, shrine) {
        this.isQuizOpen = true;
        this.player.setVelocityX(0);
        this.player.anims.stop();
        this.player.setFrame(0);
        shrine.body.enable = false;
        this.wrongAttempts = 0;
        this.showQuiz(shrine);
    }

    hitPortal(player, portal) {
        // 1. Turn off the portal's physics so this doesn't trigger rapidly
        portal.body.enable = false; 

        // 2. Stop the player
        this.player.setVelocityX(0);
        this.player.anims.stop();
        this.player.setFrame(0);
        
        // 3. Trigger your level complete logic
        this.handleLevelComplete();
    }

    showQuiz(shrine) {
        const currentPool = this.pools[this.currentLevel];

        const randomIndex = Phaser.Math.Between(0, currentPool.length - 1);
        const question = currentPool[randomIndex];
        this.quizUI = this.add.group();

        const shadow = this.add.graphics().setScrollFactor(0);
        shadow.fillStyle(0x000000, 0.2); 
        shadow.fillRoundedRect(130, 55, 750, 400, 20); 
        this.quizUI.add(shadow);

        const panel = this.add.graphics().setScrollFactor(0);
        panel.fillStyle(0xf8fbf8, 0.95); 
        panel.fillRoundedRect(125, 50, 750, 400, 20); 
        this.quizUI.add(panel);

      
        const qText = this.add.text(500, 110, question.Question, {
            fontSize: '26px', // Was 52px
            color: '#1a3b22', 
            wordWrap: { width: 650 }, // Cut from 1300 to 650
            align: 'center', fontWeight: '700', 
            fontFamily: '"Poppins", sans-serif',
            resolution: 1.5 // <-- Add resolution
        }).setOrigin(0.5).setScrollFactor(0); // Removed .setScale(0.5)

 


        this.quizUI.add(qText);

        const headerLine = this.add.rectangle(500, 170, 600, 2, 0x1a3b22, 0.1).setScrollFactor(0);
        this.quizUI.add(headerLine);



        this.feedbackText = this.add.text(500, 410, '', { 
            fontSize: '18px', // Was 36px
            color: '#1a3b22', 
            wordWrap: { width: 600 }, // Cut from 1200 to 600
            align: 'center', 
            fontFamily: '"Poppins", sans-serif', 
            fontWeight: '700',
            resolution: 3 // <-- Add resolution
        }).setOrigin(0.5).setScrollFactor(0); // Removed .setScale(0.5)
        this.quizUI.add(this.feedbackText);

        const options = [question.Option_A, question.Option_B, question.Option_C, question.Option_D];
        Phaser.Utils.Array.Shuffle(options);
        options.forEach((optionText, i) => {
            const bx = 500;
            const by = 210 + (i * 48); 

            const btnGraphics = this.add.graphics().setScrollFactor(0);
            
            const drawIdleButton = () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(0xffffff, 1);
                btnGraphics.lineStyle(2, 0xe0e5e0, 1); 
                btnGraphics.fillRoundedRect(200, by - 20, 600, 40, 15);
                btnGraphics.strokeRoundedRect(200, by - 20, 600, 40, 15);
            };
            
            const drawHoverButton = () => {
                btnGraphics.clear();
                btnGraphics.fillStyle(0xd6951a, 1); 
                btnGraphics.fillRoundedRect(200, by - 20, 600, 40, 15);
            };

            drawIdleButton();
            this.quizUI.add(btnGraphics);

         
            const btnLabel = this.add.text(bx, by, optionText, { 
                fontSize: '18px', // Was 36px
                color: '#333333', fontWeight: '600',
                fontFamily: '"Poppins", sans-serif',
                resolution: 3 // <-- Add resolution
            }).setOrigin(0.5).setScrollFactor(0); // Removed .setScale(0.5)

            this.quizUI.add(btnLabel);

            const hitArea = this.add.rectangle(bx, by, 600, 40, 0x000000, 0)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true });

            hitArea.on('pointerover', () => {
                drawHoverButton();
                btnLabel.setColor('#ffffff'); 
            });

            hitArea.on('pointerout', () => {
                drawIdleButton();
                btnLabel.setColor('#333333'); 
            });

            hitArea.on('pointerdown', () => {
                this.checkAnswer(optionText, question, randomIndex, shrine, hitArea);
            });

            this.quizUI.add(hitArea);
        });

        const uiElements = this.quizUI.getChildren();
        
        // Start all UI elements as invisible
        uiElements.forEach(el => el.setAlpha(0)); 

        // Fade them all to full opacity
        this.tweens.add({
            targets: uiElements,
            alpha: 1,
            duration: 300, 
            ease: 'Sine.easeOut'
        });
    }

    
  
    checkAnswer(selectedOption, question, index, shrine, hitArea) {
    if (selectedOption === question.Correct_Answer) {
        
        let earnedXp = question.Point;
        let feedbackString = "✔ " + question.feedback;

        if (this.wrongAttempts === 0) {
            earnedXp += 5; // Bonus 15 XP for getting it right instantly
            feedbackString = "🔥\n" + feedbackString;
        }

        // Apply the correct variables for the bonus
        this.xp += earnedXp; 
        this.xpText.setText('🧬 XP: ' + this.xp);
        this.feedbackText.setText(feedbackString).setColor('#2e8b57');
                    
        this.quizUI.getChildren().forEach(child => { if(child.disableInteractive) child.disableInteractive() });

        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: this.quizUI.getChildren(),
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    this.pools[this.currentLevel].splice(index, 1);
                    this.quizUI.clear(true, true);
                    this.isQuizOpen = false;
                    shrine.destroy(); 

                    const nextDistance = Phaser.Math.Between(700, 1200);
                    
                    // Check if there are any questions left for this level
                    if (this.pools[this.currentLevel].length === 0) {
                        this.spawnPortal(this.player.x + nextDistance);
                    } else {
                        this.spawnShrine(this.player.x + nextDistance);
                    }
                }
            });
        });
        
    } else {
        
        // --- NEW: Immediately disable the incorrect button to prevent spamming ---
        if (hitArea) {
            hitArea.disableInteractive();
        }

        this.wrongAttempts++;
        this.levelMistakes++;
        this.hearts -= 0.5;
        this.updateHeartsUI();
        this.cameras.main.shake(100, 0.01); 

        // XP PENALTY LOGIC 
        this.xp -= this.currentLevel;            
        if (this.xp < 0) {
            this.xp = 0;         
        }
        this.xpText.setText('🧬 XP: ' + this.xp); 

        // 1. Set the feedback text FIRST so the player can see it
        if (this.wrongAttempts >= 2) {
            this.feedbackText.setText(`💡 HINT: ${question.Hint}`).setColor('#d6951a');
        } else {
            this.feedbackText.setText("✘ Incorrect. Try again!").setColor('#d32f2f');
        }

        // 2. Check for Game Over AFTER setting the text
        if (this.hearts <= 0) {
            this.music.stop();
            
            // Disable all quiz buttons so the player can't keep clicking
            this.quizUI.getChildren().forEach(child => { if(child.disableInteractive) child.disableInteractive() });
            this.feedbackText.setText("✘ No hearts left!").setColor('#d32f2f');

            // 3. Wait 1.5 seconds so they can read the text, THEN fade out
            this.time.delayedCall(1500, () => {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.stop('gamebackground');
                    this.scene.start('gameover'); 
                });
            });
            return;
        } 
    }
    }

    

    handleLevelComplete() {
    // 1. Calculate Bonus: "Flawless Scholar" (No mistakes in the level)
    if (this.levelMistakes === 0) {
        this.xp += 20;
        this.xpText.setText('🧬 XP: ' + this.xp);
        
        // X: 500, Y: 250 centers it on screen. setScrollFactor(0) keeps it there during camera snap.
        const bonusText = this.add.text(500, 250, '🔥 FLAWLESS SCHOLAR! +20 XP', {
            fontSize: '24px', fontFamily: '"Poppins", sans-serif', fill: '#FFD700', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({ targets: bonusText, y: bonusText.y - 50, alpha: 0, duration: 2000 });
    }

    // Reset level mistakes for the next stage
    this.levelMistakes = 0;

    this.currentLevel++;

    // --- END OF GAME (LEVEL 3 COMPLETE) ---
    if (this.currentLevel > 3) {
        this.music.stop();
        this.player.setVelocityX(0);
        this.player.anims.stop();
        this.isQuizOpen = true; 
        this.portals.clear(true, true);

        const sage = this.add.sprite(this.player.x + 200, 300, 'ancient_sage');
        sage.setScale(0.45).setAlpha(0); // Adjusted scale to match player better
        
        this.tweens.add({
            targets: sage,
            alpha: 1,
            y: 280,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                const speech = this.add.text(sage.x, sage.y - 140, "You have finaly reached me.\nKnowledge is your greatest shield.", {
                    fontSize: '20px', fontFamily: '"Poppins", sans-serif', fill: '#ffffff',
                    align: 'center', backgroundColor: '#1a3b22', padding: { x: 15, y: 10 }
                }).setOrigin(0.5);

                this.time.delayedCall(3000, () => {
                    this.displayFinalVictory();
                });
            }
        });
        return;
    }

    // --- LEVEL TRANSITION (LEVEL 1 -> 2 or 2 -> 3) ---
    // Change the background using the Gamebackground scene
    const bgScene = this.scene.get('gamebackground');
    bgScene.changeBackground('bg' + this.currentLevel);

    this.hazards.clear(true, true);
    this.collectibles.clear(true, true);
    this.staticHearts.clear(true, true);
    this.enemies.clear(true, true); 
    this.portals.clear(true, true);

    // Update UI and Reset Player Position
    this.levelText.setText('LEVEL ' + this.currentLevel);
    this.player.setPosition(100, 300);
    this.cameras.main.fadeIn(500);

    if (this.pools[this.currentLevel] && this.pools[this.currentLevel].length === 0) {
        this.spawnPortal(this.player.x + 800);
    } else {
        this.spawnShrine(this.player.x + 800);
    }

}

    updateHeartsUI() {
        for (let i = 0; i < this.maxHearts; i++) {
            if (this.hearts >= i + 1) {
                this.heartIcons[i].setTexture('heart_full');
            } 
            else if (this.hearts > i) {
                this.heartIcons[i].setTexture('heart_half');
            } 
            else {
                this.heartIcons[i].setTexture('heart_empty');
            }
        }
    }
    

    


    heartHitGround(heart, ground) {
        if (heart.isFading) return;
        heart.isFading = true;

        this.tweens.add({
            targets: heart,
            alpha: 0, // Fade to invisible
            duration: 1000, // Player has exactly 1 second to grab it before it's gone!
            onComplete: () => {
                if (heart && heart.active) {
                    if (heart.body) {
                        heart.body.enable = false; // Directly turn off physics
                    }
                    heart.destroy(); // Safely destroy the sprite
                }
            }
        });
    }



    update() {
        if (this.isQuizOpen) return;
        const isGrounded = this.player.body.blocked.down || this.player.body.touching.down;

        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
            this.player.flipX = true; 
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
            this.player.flipX = false; 
        } else {
            this.player.setVelocityX(0);
        }

        // 3. Handle Animations based on Airborne vs Grounded state
        if (!isGrounded) {
            // --- IN THE AIR ---
            this.player.anims.stop(); // Stop the walk cycle
            
            if (this.player.body.velocity.y < 0) {
                // Moving UP (Jumping)
                this.player.setFrame(1); 
            } else {
                // Moving DOWN (Falling)
                this.player.setFrame(2); 
            }
        } else {
            // --- ON THE GROUND ---
            if (this.cursors.left.isDown || this.cursors.right.isDown) {
                this.player.anims.play('walk', true); // Walking
            } else {
                this.player.anims.stop();
                this.player.setFrame(0); // Idle (Standing still)
            }
        }

        // 4. Handle Double Jump Logic
        if (isGrounded && this.player.body.velocity.y >= 0) {
            this.jumps = 0;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.spacebar)) {
            if (isGrounded) {
                // First jump off the ground
                this.player.setVelocityY(-450);
                this.jumpSound.play();
                this.jumps = 1;

            } else if (this.jumps < 2) {
                // Second jump! 
                this.player.setVelocityY(-400); 
                this.jumpSound.play();
                this.jumps = 2; // Lock out further jumps until landing
            }
        }

        
    }
    displayFinalVictory() {
        const { width, height } = this.scale;
        
        // 1. Create a dark overlay to dim the game world
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setScrollFactor(0);
        
        // 2. Victory Header with parchment styling
        const victoryText = this.add.text(width / 2, height / 2 - 100, 'QUEST COMPLETE', {
            fontSize: '72px', 
            fontFamily: 'Georgia, serif', 
            fontWeight: 'bold', 
            fill: '#f4ebd8',
            stroke: '#362f29', 
            strokeThickness: 12
        }).setOrigin(0.5).setScrollFactor(0);

        // 3. Show the total XP earned during the "Quest for Knowledge"
        this.add.text(width / 2, height / 2, `Final Mastery: ${this.xp} XP`, {
            fontSize: '32px', 
            fontFamily: '"Poppins", sans-serif', 
            fill: '#4ade80', 
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        // 4. Temporarily disable the Return button while saving
        const homeBtn = this.add.text(width / 2, height / 2 + 100, 'SAVING XP TO LAB...', {
            fontSize: '24px', 
            fill: '#aaaaaa', 
            backgroundColor: '#362f29',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }, 
            fontFamily: 'Georgia, serif'
        }).setOrigin(0.5).setScrollFactor(0); 

        // 5. --- NEW: SAVE XP AND PROGRESS LOGIC ---
        const studentEmail = localStorage.getItem('userEmail');
        const currentChapter = localStorage.getItem('selectedChapter') || 'Chapter 4';
        
        // Your newly deployed Google Script URL!
        const scriptURL = 'https://script.google.com/macros/s/AKfycby0wZHqzzTFsWmrwMXTM7ddTxx_1RKeRM4nD54lXW2wJGqtjDOwAEAYYp3Q9jlmXNV2Lw/exec';

        if (studentEmail && this.xp > 0) {
            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'save_xp_and_progress', // Updated to match your new script
                    email: studentEmail,
                    xp: this.xp,
                    chapterCompleted: currentChapter // Sending the badge to the cloud!
                })
            })
            .then(res => res.json())
            .then(data => {
                if(data.result === 'success') {
                    console.log("XP and Progress successfully saved to database!");
                }
                // Unlock the button
                homeBtn.setText('RETURN TO ACADEMY');
                homeBtn.setStyle({ fill: '#f4ebd8' });
                homeBtn.setInteractive({ useHandCursor: true });
            })
            .catch(err => {
                console.error("Failed to save progress:", err);
                homeBtn.setText('RETURN TO ACADEMY (Save Error)');
                homeBtn.setStyle({ fill: '#f4ebd8' });
                homeBtn.setInteractive({ useHandCursor: true });
            });
        } else {
            // Guest or 0 XP
            homeBtn.setText('RETURN TO ACADEMY');
            homeBtn.setStyle({ fill: '#f4ebd8' });
            homeBtn.setInteractive({ useHandCursor: true });
        }

        // 6. Scene Transition Logic
        homeBtn.on('pointerdown', () => {
            this.scene.stop('gamebackground'); 
            this.scene.start('titlescreen');   
        });
    }

    
}
