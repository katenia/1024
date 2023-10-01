
var game;
// ability to change board size in one place without having to edit all lines of code. Variables used throughtout code
var gameOptions = {
    tileSize: 200,
    tileSpacing:20,
    boardSize: {
        rows: 4,
        cols: 4
    },
    tweenSpeed:500,
    //touch movement variables
    swipeMaxTime: 1000,
    swipeMinDistance: 20,
    swipeMinNormal: 0.85,
    aspectRatio: 16/9
}

//constance for directions
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

//create the window for the game to run in.
window.onload = function() {
    var tileAndSpacing = gameOptions.tileSize + gameOptions.tileSpacing;
    var width = gameOptions.boardSize.cols * tileAndSpacing;
    width += gameOptions.tileSpacing;
    var gameConfig = {
        width: width,
        height: width * gameOptions.aspectRatio,
        backgroundColor: 0xecf0f1,
        scene:[bootGame,playGame]
    }

// create a new game object using the phaser framework
game = new Phaser.Game(gameConfig);
window.focus();
resizeGame();
window.addEventListener("resize", resizeGame);

}


function resizeGame() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
 }



class bootGame extends Phaser.Scene { 
    constructor(){
        super("BootGame");
    }
    preload() {
        this.load.image("restart", "assets/sprites/restart.png");
        this.load.image("scorepanel", "assets/sprites/scorepanel.png");
        this.load.image("scorelabels", "assets/sprites/scorelabels.png");
        this.load.image("logo", "assets/sprites/KADlogo.png");
        this.load.image("howtoplay", "assets/sprites/howtoplay.png");
        this.load.image("gametitle", "assets/sprites/gametitle.png");
        this.load.image("emptytile", "assets/sprites/emptytile.png");
        this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
            frameWidth: gameOptions.tileSize,
            frameHeight: gameOptions.tileSize
        });
        this.load.audio("move", ["assets/sounds/move.ogg", "assets/sounds/move.mp3"]);
        this.load.audio("grow", ["assets/sounds/grow.ogg", "assets/sounds/grow.mp3"]);
    }
    create() {
        this.scene.start("PlayGame");
    }
}

class playGame extends Phaser.Scene { 
    constructor() {
        super("PlayGame");
    }
    create() {
        var restartXY = this.getTilePosition(-0.9, gameOptions.boardSize.cols -1);
        var restartButton = this.add.sprite(restartXY.x, restartXY.y, "restart");
        restartButton.setInteractive();
        restartButton.on("pointerdown", function(){
            this.scene.start("PlayGame");
        }, this);
        var scoreXY = this.getTilePosition(-0.9, 1);
        this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
        this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");
        var gameTitle = this.add.image(10, 5, "gametitle");
        gameTitle.setOrigin(0, -0.2);
        var howTo = this.add.image(game.config.width, 5, "howtoplay");
        howTo.setOrigin(1, -0.3);
        var logo = this.add.sprite(game.config.width / 2, game.config.height , "logo");
        logo.setOrigin(0.5, 1.5)

        this.canMove = false;
        //initializes an empty array
        this.boardArray = [];
        //create the gride using a nested loop
        for(var i = 0; i < gameOptions.boardSize.rows; i++){
            this.boardArray[i] = [];
            for(var j = 0; j < gameOptions.boardSize.cols; j++){
                var tilePosition = this.getTilePosition(i, j);
                //set empty tile as the background board image
                this.add.image(tilePosition.x, tilePosition.y, "emptytile");
                //load the tiles spritesheet
                var tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
                //set visibility to false
                tile.visible = false;
                //store the board/tile coordinates into our array
                this.boardArray[i][j] = {
                    tileValue:0,
                    tileSprite: tile,
                    upgraded: false
                }

            }
        }
        //add a couple of random tiles to the board
        this.addTile();
        this.addTile();

        //check for input on the keyboard or with a swipe
        this.input.keyboard.on("keydown", this.handleKey, this);
        this.input.on("pointerup", this.handleSwipe, this);

        this.moveSound = this.sound.add("move");
        this.growSound = this.sound.add("grow");
      }

      
    //get tile position, do some math, return it as a phaser object
    getTilePosition(row, col){
        var posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
        var posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);

        var boardHeight = gameOptions.boardSize.rows * gameOptions.tileSize;
        boardHeight += (gameOptions.boardSize.rows +1) * gameOptions.tileSpacing;
        var offsetY = (game.config.height - boardHeight) / 2;
        posY += offsetY;
        return new Phaser.Geom.Point(posX, posY);
    }


    //handle helpers The second
    handleKey(e) {
        if(this.canMove) {
            switch(e.code) {
                case "KeyA":
                case "ArrowLeft":
                    console.log("left");
                    this.makeMove(LEFT);
                    break;
                case "KeyD":
                case "ArrowRight":
                    console.log("right");
                    this.makeMove(RIGHT);
                    break;
                case "KeyW":
                case "ArrowUp":
                    console.log("UP"),
                    this.makeMove(UP);
                    break;
                case "KeyS":
                case "ArrowDown":
                    console.log("Down"),
                    this.makeMove(DOWN);
                    break;
            }
        }
    }

    //handle swipe the Second
    handleSwipe(e){
        if(this.canMove){
            var swipeTime = e.upTime - e.downTime;
            var fastEnough = swipeTime < gameOptions.swipeMaxTime;
            var swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
            var swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
            var longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
            if(longEnough && fastEnough){
                Phaser.Geom.Point.SetMagnitude(swipe, 1);
                    if(swipe.x > gameOptions.swipeMinNormal){
                        this.makeMove(RIGHT);
                    }
                    if(swipe.x < -gameOptions.swipeMinNormal){
                        this.makeMove(LEFT);
                    }
                    if(swipe.y > gameOptions.swipeMinNormal){
                        this.makeMove(DOWN);
                    }
                    if(swipe.y < -gameOptions.swipeMinNormal){
                        this.makeMove(UP);
                    }
            }
        }
    }
    
    //make a tile move
    makeMove(d){
        this.movingTiles = 0;
        var dRow = (d == LEFT || d == RIGHT) ? 0: d == UP ? -1 : 1;
        var dCol = (d == UP || d == DOWN) ? 0 : d == LEFT ? -1 : 1;
        this.canMove = false;
        var firstRow = (d == UP) ? 1 : 0;
        var lastRow = gameOptions.boardSize.rows - ((d == DOWN) ? 1 : 0);
        var firstCol = (d == LEFT) ? 1 : 0;
        var lastCol = gameOptions.boardSize.cols - ((d == RIGHT) ? 1 : 0);
        for(var i = firstRow; i < lastRow; i++){
            for(var j = firstCol; j < lastCol; j++){
                var curRow = dRow == 1 ? (lastRow - 1) - i : i;
                var curCol = dCol == 1 ? (lastCol - 1) - j : j;
                var tileValue = this.boardArray[curRow][curCol].tileValue;
                if(tileValue != 0){
                    var newRow = curRow;
                    var newCol = curCol;
                    while(this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)){
                        newRow += dRow;
                        newCol += dCol;
                    }
                    if (newRow != curRow || newCol != curCol){
                        var newPos = this.getTilePosition(newRow, newCol);
                        var willUpdate = this.boardArray[newRow][newCol].tileValue == tileValue;
                        this.moveTile(this.boardArray[curRow][curCol].tileSprite, newPos, willUpdate);
                        this.boardArray[curRow][curCol].tileValue = 0;
                        
                        if(willUpdate){
                            this.boardArray[newRow][newCol].tileValue ++;
                            this.boardArray[newRow][newCol].upgraded = true;
                            //this.boardArray[curRow][curCol].tileSprite.setFrame(tileValue);
                        }
                        else {
                            this.boardArray[newRow][newCol].tileValue = tileValue;
                        }
                    }
                }  
            }
        }
        if(this.movingTiles == 0){
            this.canMove = true;
        }
        else {
            this.moveSound.play();
        }
    }
    //the moveTile method will handle all tile movement, position, and depth.
    moveTile(tile, point, upgraded){
        this.movingTiles++;
        tile.depth = this.movingTiles;
        var distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
        this.tweens.add({
            targets: [tile],
            x: point.x,
            y: point.y,
            duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
            callbackScope: this,
            onComplete: function() {
                if(upgraded) {
                    this.upgradeTile(tile);
                }
                else {
                    this.endTween(tile);
                }
            }
        })
    }

    upgradeTile(tile){
        this.growSound.play();
        tile.setFrame(tile.frame.name + 1);
        this.tweens.add( {
            targets: [tile],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: gameOptions.tweenSpeed,
            yoyo: true,
            repeat: 1,
            callbackScope: this,
            onComplete: function() {
                this.endTween(tile);
            }
        })
    }

    endTween(tile) {
        this.movingTiles --;
        tile.depth = 0;
        if(this.movingTiles == 0) {
            this.refreshBoard();
        }
    }

    // check to see if the new position is a legal position for a tile. Stops it from "falling" off board
    isLegalPosition(row, col, value){
        var rowInside = row >= 0 && row < gameOptions.boardSize.rows;
        var colInside = col >= 0 && col < gameOptions.boardSize.cols;
        if(!rowInside || !colInside) {
            return false;
        }
        var emptySpot = this.boardArray[row][col].tileValue == 0;
        var sameValue = this.boardArray[row][col].tileValue == value;
        var alreadyUpgraded = this.boardArray[row][col].upgraded;
        return emptySpot || (sameValue && !alreadyUpgraded);
    }

    refreshBoard(){
        for(var i = 0; i < gameOptions.boardSize.rows; i++){
            for(var j = 0; j < gameOptions.boardSize.cols; j++){
                var spritePosition = this.getTilePosition(i, j);
                this.boardArray[i][j].tileSprite.x = spritePosition.x;
                this.boardArray[i][j].tileSprite.y = spritePosition.y;
                var tileValue = this.boardArray[i][j].tileValue;
                if(tileValue > 0){
                    this.boardArray[i][j].tileSprite.visible = true;
                    this.boardArray[i][j].tileSprite.setFrame(tileValue - 1);
                    this.boardArray[i][j].upgraded = false;
                }
                else {
                    this.boardArray[i][j].tileSprite.visible = false;
                }
            }
        }
        this.addTile();
    }

    //add Tiles function. where we add tiles to board game
    addTile(){
        var emptyTiles = [];
        for(var i = 0; i < gameOptions.boardSize.rows; i++){
            for(var j = 0; j < gameOptions.boardSize.cols; j++){
                if(this.boardArray[i][j].tileValue == 0){
                    emptyTiles.push({
                        row: i,
                        col: j
                    })
                }
            }
        }
        if(emptyTiles.length > 0){
            var chosenTile = Phaser.Utils.Array.GetRandom(emptyTiles);
            this.boardArray[chosenTile.row][chosenTile.col].tileValue = 1;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.visible = true;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
            this.tweens.add({
                targets: [this.boardArray[chosenTile.row][chosenTile.col].tileSprite],
                alpha: 1,
                duration: gameOptions.tweenSpeed,
                callbackScope: this,
                onComplete: function() {
                    console.log("animation complete");
                    this.canMove = true;
                }
            });
        }
    }
}