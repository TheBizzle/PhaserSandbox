window.addEventListener('load', function() {

  type EntityObject = {
    [index: string]: Phaser.Sprite
  }

  interface Size {}

  class DefaultSize implements Size {}

  let defaultSize = new DefaultSize()

  class CustomSize implements Size {
    x: number;
    y: number;
    constructor(newX: number, newY: number) {
      this.x = newX;
      this.y = newY;
    }
  }

  type Spec = {
    name: string;
    x: number;
    y: number;
    gravityY: number;
    size: Size;
    spriteName: string;
  }

  let game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

  let entities: EntityObject = {};

  let platforms:  Phaser.Group;
  let cursors:    Phaser.CursorKeys;
  let jumpButton: Phaser.Key;

  function preload(): void {

    game.stage.backgroundColor = '#85b5e1';

    game.load.baseURL     = '/assets/';
    game.load.crossOrigin = 'anonymous';

    game.load.image('player'  , 'sprites/phaser-dude.png');
    game.load.image('npc1'    , 'sprites/clown.png');
    game.load.image('platform', 'sprites/platform.png');
    game.load.image('face'    , 'sprites/clownhead.gif');

  }

  function create(): void {

    let createEntity = function(spec: Spec): Phaser.Sprite {

      let entity = game.add.sprite(spec.x, spec.y, spec.spriteName);

      game.physics.arcade.enable(entity);
      entity.body.collideWorldBounds = true;
      entity.body.gravity.y          = spec.gravityY;

      if (spec.size instanceof CustomSize) {
        entity.width  = spec.size.x;
        entity.height = spec.size.y;
      }

      return entity;

    };

    let entitySpecs = [
      { name: "player", x: 100, y: 200, gravityY: 500, size:            defaultSize, spriteName: "player" }
    , { name: "npc1"  , x: 500, y: 400, gravityY: 500, size:            defaultSize, spriteName: "npc1" }
    , { name: "npc2"  , x: 460, y: 400, gravityY: 500, size:            defaultSize, spriteName: "npc1" }
    , { name: "npc3"  , x: 515, y: 120, gravityY: 500, size:            defaultSize, spriteName: "npc1" }
    , { name: "face"  , x: 650, y: 500, gravityY:   0, size: new CustomSize(50, 75), spriteName: "face" }
    ];

    entitySpecs.forEach(function(spec: Spec) {
      entities[spec.name] = createEntity(spec);
    });

    platforms = game.add.physicsGroup();

    platforms.create( 500, 150, 'platform');
    platforms.create(-200, 300, 'platform');
    platforms.create( 0, 450, 'platform');

    platforms.setAll('body.immovable', true);

    cursors    = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    for (let key in entities) {
      if (key.indexOf("npc") != -1) {
        entities[key].body.velocity.x = game.rnd.between(-250, 250);
        entities[key].body.desiredVelocity = entities[key].body.velocity.x;
      }

    }

  }

  function murder(baddie: Phaser.Sprite, player: Phaser.Sprite): void {

    let playerBottom = player.y + player.height;

    if(playerBottom > (baddie.y + 6)) {
      player.kill();
    } else {
      player.body.velocity.y = -250;
      baddie.kill();
    }

  }

  let moveFaces = function(faces: Array<Phaser.Sprite>, player: Phaser.Sprite): void {
    faces.forEach((face) => {

      game.physics.arcade.collide(face, player, murder);

      if (Phaser.Point.distance(face.world, player.world) < 350) {

       type AngleBetweenable = { angleBetween(x1: number, y1: number, x2: number, y2: number): number } // TODO: Jason, fix this
       let rotation = (<AngleBetweenable> game.math).angleBetween(
          player.x, player.y,
          face.x, face.y
        );
        let faceSpeed = -250;

        face.body.velocity.x = Math.cos(rotation) * faceSpeed;
        face.body.velocity.y = Math.sin(rotation) * faceSpeed;


      };

    });

  }

  let moveClowns = function(clowns: Array<Phaser.Sprite>, player: Phaser.Sprite): void {

    clowns.forEach((clown) => {

      game.physics.arcade.collide(clown, player, murder);

      let nearestPlatform = (<Phaser.Sprite> platforms.children.sort(
        function(p1, p2) {
          if (Math.abs(p1.y - clown.y) < Math.abs(p2.y - clown.y)) {
            return -1;
          } else {
            return 1;
          };
        }
      )[0]);

      if (clown.x < nearestPlatform.x) {
        clown.x = Math.max(nearestPlatform.x, 0);
      } else if ((clown.x + clown.width) > (nearestPlatform.width + nearestPlatform.x)) {
        clown.x = Math.min(nearestPlatform.width + nearestPlatform.x, game.width) - clown.width;
      }

      let isAtPlatformLeftEdge  = clown.x <= nearestPlatform.x;
      let isAtPlatformRightEdge = (nearestPlatform.width + nearestPlatform.x) <= (clown.width + clown.x);
      let antiJitterFactor      = 4.5;

      if (isAtPlatformLeftEdge) {
        clown.body.velocity.x      = -clown.body.desiredVelocity;
        clown.body.desiredVelocity = clown.body.velocity.x;
        clown.x = Math.max(nearestPlatform.x, 0) + antiJitterFactor;
      } else if (isAtPlatformRightEdge) {
        clown.body.velocity.x      = -clown.body.desiredVelocity;
        clown.body.desiredVelocity = clown.body.velocity.x;
        clown.x = Math.min((nearestPlatform.x + nearestPlatform.width), game.world.bounds.width) - (clown.width + antiJitterFactor);
      }

    });

  }

  function update(): void {

    for (let key in entities) {
      game.physics.arcade.collide(entities[key], platforms);
    }

    let player = entities['player'];

    let clowns = [];

    for (let key in entities) {
      if (key.indexOf("npc") != -1) {
        clowns.push(entities[key]);
      }
    }

    moveClowns(clowns, player);

    let faces = [];

    for (let key in entities) {
      if (key.indexOf("face") != -1){
        faces.push(entities[key]);
      }
    }

    moveFaces(faces, player);

    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
      player.body.velocity.x = -250;
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 250;
    }

    if ((jumpButton.isDown || cursors.up.isDown) && (player.body.onFloor() || player.body.touching.down)) {
      player.body.velocity.y = -400;
    }

    for (let key in entities) {
      if (entities[key].y >= (game.height - entities[key].height)) {
        entities[key].kill();
      }
    }

    if (!player.alive) {
      game.state.restart();
    }

  }

});