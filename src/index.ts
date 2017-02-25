window.addEventListener('load', function() {

  type EntityObject = {
    [index: string]: Phaser.Sprite
  }

  type Spec = {
    name: string;
    x: number;
    y: number;
    spriteName: string;
  }

  var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

  var entities: EntityObject = {};

  let platforms: Phaser.Group;
  let cursors: Phaser.CursorKeys;
  let jumpButton: Phaser.Key;

  function preload() {

    game.stage.backgroundColor = '#85b5e1';

    game.load.baseURL     = 'http://examples.phaser.io/assets/';
    game.load.crossOrigin = 'anonymous';

    game.load.image('player',   'sprites/phaser-dude.png');
    game.load.image('npc1',     'sprites/clown.png');
    game.load.image('platform', 'sprites/platform.png');

  }

  function create() {

    let createEntity = function(spec: Spec) {

      var entity = game.add.sprite(spec.x, spec.y, spec.spriteName);

      game.physics.arcade.enable(entity);
      entity.body.collideWorldBounds = true;
      entity.body.gravity.y          = 500;

      return entity;

    };

    var entitySpecs = [
      { name: "player", x: 100, y: 200, spriteName: "player" }
    , { name: "npc1"  , x: 500, y: 400, spriteName: "npc1" }
    , { name: "npc2"  , x: 460, y: 400, spriteName: "npc1" }
    , { name: "npc3"  , x: 515, y: 120, spriteName: "npc1" }
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

    for (var key in entities) {
      if (key !== "player") {
        entities[key].body.velocity.x = game.rnd.between(-250, 250);
        entities[key].body.desiredVelocity = entities[key].body.velocity.x;
      }

    }

  }

  function murder(player1: Phaser.Sprite, player2: Phaser.Sprite) {
    player2.body.velocity.y = -250;
    player1.kill();
  }

  let moveClowns = function() {

    for (var key in entities) {
      if (key.indexOf("npc") != -1) {

        let clown = entities[key];
        game.physics.arcade.collide(clown, entities['player'], murder);

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
        let isAtGameLeftEdge      = clown.x <= 0;
        let isAtPlatformRightEdge = (nearestPlatform.width + nearestPlatform.x) <= (clown.width + clown.x);
        let isAtGameRightEdge     = (clown.x + clown.width) >= game.width; // Ryan likes clown speed
        let antiJitterFactor      = 4.5;

        if (isAtPlatformLeftEdge || isAtGameLeftEdge) {
          entities[key].body.velocity.x      = -entities[key].body.desiredVelocity;
          entities[key].body.desiredVelocity = entities[key].body.velocity.x;
          clown.x = Math.max(nearestPlatform.x, 0) + antiJitterFactor;
        } else if (isAtPlatformRightEdge || isAtGameRightEdge) {
          entities[key].body.velocity.x      = -entities[key].body.desiredVelocity;
          entities[key].body.desiredVelocity = entities[key].body.velocity.x;
          clown.x = Math.min((nearestPlatform.x + nearestPlatform.width), game.width) - (clown.width + antiJitterFactor);
        }

      }
    }

  }

  function update() {

    for (var key in entities) {
      game.physics.arcade.collide(entities[key], platforms);
    }

    var player = entities['player'];

    moveClowns();

    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
      player.body.velocity.x = -250;
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 250;
    }

    if ((jumpButton.isDown || cursors.up.isDown) && (player.body.onFloor() || player.body.touching.down)) {
      player.body.velocity.y = -400;
    }

    for (var key in entities) {
      if (entities[key].y >= (game.height - entities[key].height)) {

        entities[key].kill();

        if (entities[key] === player) {
          game.state.restart();
          create();
        }
      }
    }
  }

});