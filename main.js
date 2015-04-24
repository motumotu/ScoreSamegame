enchant();

//--- 定数
const BLOCK_WIDTH_NUM = 10;     // 横のブロック数
const BLOCK_HEIGHT_NUM = 14;    // 縦のブロック数
const BLOCK_COLOR_NUM = 5;      // ブロックの色の種類
const SIZE_BLOCK_WIDTH = 32;    // ブロックの画像の横幅
const SIZE_BLOCK_HEIGHT = 20;   // ブロックの画像の縦幅
const SIZE_WINDOW_WIDTH = 320;  // 画面横幅
const SIZE_WINDOW_HEIGHT = 320; // 画面縦幅

//---- 変数
var core;       // コアオブジェクト
var score;      // スコア
var num;        // 残り回数
var board;      // 盤面

//---------------------------------------------------------------
// ページ読み込み時
//---------------------------------------------------------------
window.onload = function() {
    core = new Core(SIZE_WINDOW_WIDTH, SIZE_WINDOW_HEIGHT);
    core.preload('block.png');  // 画像の読み込み

    // 初期化処理
    score = 0;       // スコアを0に初期化
    num = 15;        // 残りクリック回数を15回に設定

    core.onload = function() {
        // 盤面生成
        board = new Board();
        // スコア表示
        var scoreLabel = new Label();
        scoreLabel.x = 20;
        scoreLabel.y = 10;
        scoreLabel.font = '17px "Arial"';
        scoreLabel.text = "スコア    0点";
        scoreLabel.on('enterframe', function() {
            scoreLabel.text = "スコア "+score+"点";
        });
        core.rootScene.addChild(scoreLabel);
        // 残り回数
        var numLabel = new Label();
        numLabel.x = 210;
        numLabel.y = 10;
        numLabel.font = '17px "Arial"';
        numLabel.text = "残り   0回";
        numLabel.on('enterframe', function() {
            numLabel.text = "残り "+num+"回";
        });
        core.rootScene.addChild(numLabel);
        // クリック処理
        core.rootScene.on('touchstart', function(e) {
            var x = changePosX(e.x);
            var y = changePosY(e.y);
            board.clickProcess(x, y);
        });
    }
    core.start();                           // アプリの開始
};

//---------------------------------------------------------------
// ブロッククラス
//---------------------------------------------------------------
var Block = Class.create(Sprite, {        // クラス定義、Spriteを継承
    // コンストラクタ
    initialize: function(x, y, color) {   // 初期処理
        Sprite.call(this, SIZE_BLOCK_WIDTH, SIZE_BLOCK_HEIGHT);// 継承元のクラスの初期化処理を呼び出し
        this.color = color;                     // 色を設定
        this.setPos(x, y);                      // 位置設定
        this.image = core.assets['block.png'];  // 画像を設定
        this.frame = color;                     // 色設定
        core.rootScene.addChild(this);          // コアオブジェクトに追加
    },
    // 削除
    remove: function() {
        this.tl.scaleTo(0, 0, 5, enchant.Easing.LINEAR).removeFromScene(); // 縮小して削除
    },
    // 移動
    move: function() {
        this.x = this.posX * SIZE_BLOCK_WIDTH;
        this.y = this.posY * SIZE_BLOCK_HEIGHT + SIZE_WINDOW_HEIGHT - BLOCK_HEIGHT_NUM * SIZE_BLOCK_HEIGHT;
    },
    // 場所設定
    setPos: function(x, y) {
        this.posX = x;
        this.posY = y;
        this.move();
    }
});
//---------------------------------------------------------------
// 盤面クラス
//---------------------------------------------------------------
var Board = Class.create({        // クラス定義
    // コンストラクタ
    initialize: function() {
        this.board = [];
        for (var y = 0; y < BLOCK_HEIGHT_NUM; y++) {
            this.board[y] = [];
            for (var x = 0; x < BLOCK_WIDTH_NUM; x++) {
                this.board[y][x] = new Block(x, y, rand(BLOCK_COLOR_NUM));
            }
        }
    },
    // クリック処理
    clickProcess: function(x, y) {
        if (this.outCheck(x, y)) return;         // 範囲外チェック
        if (num > 0 && this.removeCheck(x, y)) { // 消せるか
            num--;             // 残り回数を1減らす
            this.rmnum = 0;    // 消した数
            this.removeBlock(x, y, this.board[y][x].color); // ブロック削除
            score += Math.floor(this.rmnum * (1 + this.rmnum / 5.0)); // スコア追加
            this.fallBlock();     // 落下処理
            this.addBlock();      // 消えた分ブロック追加
        }
    },
    // ブロックの削除
    removeBlock: function(x, y, color) {
        var dx = [0, 1, 0, -1];                                 // x方向の変化量
        var dy = [-1, 0, 1, 0];                                 // y方向の変化量
        for (var k = 0; k < 4; k++) {                           // 上下左右の4方向確認
            var px = x + dx[k];                                 // x方向に移動
            var py = y + dy[k];                                 // y方向に移動
            if (this.outCheck(px, py)) continue;                // 範囲外チェック
            if (this.board[py][px].color != color) continue;    // 色が違うなら無視
            if (this.board[py][px] == 0) continue;              // 消えてたら無視
            this.board[py][px].remove();                        // ブロックの処理
            this.board[py][px] = 0;                             // 配列から消す
            this.rmnum++;                                       // 消した数を1減らす
            this.removeBlock(px, py, color);                    // 再帰で幅優先探索
        }
    },
    // 消せるか判定
    removeCheck: function(x, y) {
        var dx = [0, 1, 0, -1];                                 // x方向の変化量
        var dy = [-1, 0, 1, 0];                                 // y方向の変化量
        for (var k = 0; k < 4; k++) {                           // 上下左右の4方向確認
            var px = x + dx[k];                                 // x方向に移動
            var py = y + dy[k];                                 // y方向に移動
            if (this.outCheck(px, py)) continue;                // 範囲外チェック
            if (this.board[py][px] == 0) continue;              // 消えてたら無視
            if (this.board[py][px].color == this.board[y][x].color) // 色が同じか
                return true;
        }
        return false;        // 周囲に同じ色のブロックがなかった
    },
    // ブロック落下処理
    fallBlock: function() {
        var end = true;
        while (end) {
            end = false;
            for (var y = BLOCK_HEIGHT_NUM - 1; y >= 1; y--) {
                for (var x = 0; x < BLOCK_WIDTH_NUM; x++) {
                    if (this.board[y][x] == 0 && this.board[y - 1][x] != 0) {
                        end = true;
                        this.board[y][x] = this.board[y - 1][x];
                        this.board[y - 1][x] = 0;
                        this.board[y][x].setPos(x, y);
                    }
                }
            }
        }
    },
    // 空マスにブロックの追加
    addBlock: function() {
        for (var y = 0; y < BLOCK_HEIGHT_NUM; y++) {
            for (var x = 0; x < BLOCK_WIDTH_NUM; x++) {
                if (this.board[y][x] == 0) {
                    this.board[y][x] = new Block(x, y, rand(BLOCK_COLOR_NUM));
                }
            }
        }
    },
    // 範囲外チェック
    outCheck: function(x, y) {
        return (x < 0 || x >= BLOCK_WIDTH_NUM || y < 0 || y >= BLOCK_HEIGHT_NUM);
    }
});
// 0~n-1の数字を生成
function rand(n) {
    return Math.floor(Math.random() * n);
}
// x座標を位置に変換
function changePosX(x) {
    return Math.floor(x / SIZE_BLOCK_WIDTH);
}
// y座標を位置に変換
function changePosY(y) {
    return Math.floor((y - SIZE_WINDOW_HEIGHT + BLOCK_HEIGHT_NUM * SIZE_BLOCK_HEIGHT) / SIZE_BLOCK_HEIGHT);
}