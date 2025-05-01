/*  Maze Runner – p5.play v2 solution  ● Ali Zabihi 2025
 *  ──────────────────────────────────────────────────
 *  • Reads a 2-D text map (“maze.txt”) of 0 1 2 3.
 *  • Creates wall / floor / start / exit tiles as sprites.
 *  • Spawns a player sprite on the start tile, facing the first open neighbour.
 *  • Smooth arrow-key movement with instant rotation.
 *  • Wall bump-back so the centre of the player never passes tile mid-point.
 *  • Re-spawns on the start tile whenever the player reaches the exit.
 *  • All geometry driven by TILE and PLAYER_SIZE constants – change once,
 *    the whole maze rescales automatically.
 *  ──────────────────────────────────────────────────    */

/// ─── GLOBAL CONSTANTS ──────────────────────────────────────────────
const TILE    = 64;   // tile width & height  (try 32, 48, …)
const SPEED   = 5.0;  // player pixels-per-frame
const PLAYER_SIZE = 42;          // must be < TILE
const BUMP_BACK   = TILE / 4.0;  // how much to “bounce” off walls

/// ─── GLOBAL STATE ─────────────────────────────────────────────────
let rawMaze;               // array of text lines (strings)
let rows, cols;            // maze dimensions
let wallGroup, floorGroup, exitGroup;
let player;
let startPos;              // p5.Vector of start-tile centre

/// ─── ASSETS ───────────────────────────────────────────────────────
let imgWall, imgFloor, imgStart, imgExit, imgPlayer;

function preload() {
  rawMaze   = loadStrings('maze.txt');     //  ❊ 0 1 2 3 map
  imgWall   = loadImage('wall.png');
  imgFloor  = loadImage('floor.png');
  imgStart  = loadImage('start.png');
  imgExit   = loadImage('exit.png');
  imgPlayer = loadImage('player.png');
}

function setup() {
  rows = rawMaze.length;
  cols = rawMaze[0].trim().length;      // supports “0 1 0 3 …” or “0103”
  createCanvas(cols * TILE, rows * TILE);
  wallGroup  = new Group();
  floorGroup = new Group();
  exitGroup  = new Group();

  parseMaze();               // build all tile sprites & remember startPos
  makePlayer();              // create + orient player sprite
}

function draw() {
  background(40);            // dark grey border behind maze

  handleInput();             // arrow keys & wall blocking
  drawSprites();
}

/// ─── BUILD MAZE FROM TEXT FILE ────────────────────────────────────
function parseMaze() {
  for (let r = 0; r < rows; r++) {
    let tokens = rawMaze[r].trim().split(/\s*/).filter(t => t !== '');
    if (tokens.length === 1 && tokens[0].length === cols) {
      tokens = tokens[0].split('');
    }                         // now tokens.length === cols
    for (let c = 0; c < cols; c++) {
      let code = int(tokens[c]);
      let x = c * TILE + TILE / 2;
      let y = r * TILE + TILE / 2;

      switch (code) {
        case 1: createTile(x, y, imgWall, wallGroup);  break;
        case 0: createTile(x, y, imgFloor, floorGroup); break;
        case 2: createTile(x, y, imgStart, floorGroup); startPos = createVector(x, y); break;
        case 3: createTile(x, y, imgExit,  exitGroup);  break;
      }
    }
  }
}

function createTile(x, y, img, groupRef) {
  let s = createSprite(x, y, TILE, TILE);
  s.addImage(img);
  s.setCollider('rectangle', 0, 0, TILE, TILE);
  s.immovable = true;
  groupRef.add(s);
}

/// ─── PLAYER ───────────────────────────────────────────────────────
function makePlayer() {
  player = createSprite(startPos.x, startPos.y, PLAYER_SIZE, PLAYER_SIZE);
  player.addImage(imgPlayer);
  player.setCollider('circle', 0, 0, PLAYER_SIZE / 2);
  player.maxSpeed = SPEED;
  orientPlayerToOpenTile();
}

function orientPlayerToOpenTile() {
  // look N,E,S,W for first empty tile to face
  const dirs = [ [0,-1, 270], [1,0, 0], [0,1, 90], [-1,0, 180] ];
  for (let [dx, dy, rot] of dirs) {
    let cx = (player.position.x + dx * TILE);
    let cy = (player.position.y + dy * TILE);
    if (!wallAt(cx, cy)) { player.rotation = rot; break; }
  }
}

/// ─── INPUT & MOVEMENT ─────────────────────────────────────────────
function handleInput() {
  // Desired velocity vector
  let vx = 0, vy = 0;
  if (keyDown(LEFT_ARROW))  { vx = -SPEED; player.rotation = 180; }
  if (keyDown(RIGHT_ARROW)) { vx =  SPEED; player.rotation =   0; }
  if (keyDown(UP_ARROW))    { vy = -SPEED; player.rotation = 270; }
  if (keyDown(DOWN_ARROW))  { vy =  SPEED; player.rotation =  90; }
  player.setVelocity(vx, vy);

  // Collide with walls & apply slight bump-back
  player.collide(wallGroup, (p, w) => {
    // push just enough so player stays in its tile half
    const offset = createVector(p.velocity.x, p.velocity.y).setMag(BUMP_BACK);
    p.position.sub(offset);
    p.setVelocity(0, 0);
  });

  // Reached exit?
  if (player.overlap(exitGroup)) {
    player.position.set(startPos);
    player.setVelocity(0, 0);
    orientPlayerToOpenTile();
  }
}

/// ─── UTILITY ──────────────────────────────────────────────────────
function wallAt(x, y) {
  // returns true if any wall sprite overlaps point
  for (let w of wallGroup) if (w.overlapPoint(x, y)) return true;
  return false;
}
