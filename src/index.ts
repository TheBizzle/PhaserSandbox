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
    platforms.create( 400, 450, 'platform');

    platforms.setAll('body.immovable', true);

    cursors    = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  }

  function murder(player1: Phaser.Sprite, player2: Phaser.Sprite) {
    player2.body.velocity.y = -250;
    player1.kill();
  }

  function update() {

    for (var key in entities) {
      game.physics.arcade.collide(entities[key], platforms);
    }

    var player = entities['player'];

    for (var key in entities) {
      if (key !== "player") {
        game.physics.arcade.collide(entities[key], player, murder);
      }
    }

    player.body.velocity.x = 0;

    if (cursors.left.isDown) {
      player.body.velocity.x = -250;
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 250;
    }

    if ((jumpButton.isDown || cursors.up.isDown) && (player.body.onFloor() || player.body.touching.down)) {
      player.body.velocity.y = -400;
    }

    if (player.y >= (game.height - player.height)) {
      player.kill();
    }

  }

});