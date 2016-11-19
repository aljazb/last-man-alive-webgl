window.addEventListener('DOMContentLoaded', main);

var keys = { left: false, right: false, up: false, down: false, fire: false };
var vector_direction = { 0: [0,1], 1: [1,1], 2: [1,0], 3: [1,-1], 4: [0,-1], 5: [-1,-1], 6: [-1,0], 7: [-1,1]};
var engine, scene, light, character, ground;
var charMoveSpeed = 0.05;
var zombieMoveSpeed = 0.02;
var bulletMoveSpeed = 0.2;
var radius = 3;
var direction = 0;
var zombies = [];
var bullets = [];
var holyDoor;
var doorLife = 5;
var groundX = 30;
var groundZ = 25;
var lastFireTime = Date.now();
var lastZombieTime = Date.now();
var doorsDestroyed = false;
var waitFrames = 0;
var redemption = false;
var gunshot_sound, zombie_pain_sound, character_suffer_sound, hallelujah_sound, doors_shot_sound;


function main(){
    createScene();
    
    engine.runRenderLoop(function() {
        scene.render();
    });

    window.addEventListener('resize', function() { engine.resize(); });
    
    window.addEventListener("keydown", function() { key_up_or_down(event, true); });
    window.addEventListener("keyup", function() { key_up_or_down(event, false); });
    
    window.addEventListener("click", mouseClick);
    window.addEventListener("keypress", makeBullet);
    
    engine.runRenderLoop(update);
    
    // ob kliku na character se celotna scena v 1000 ms obarva zeleno
    character.actionManager = new BABYLON.ActionManager(scene);
	character.actionManager.registerAction(new BABYLON.InterpolateValueAction(
	    BABYLON.ActionManager.OnPickTrigger, light, "diffuse", BABYLON.Color3.Green(), 1000))
	    
}

function mouseClick() {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY);
    var x = pickResult.pickedPoint.x;
    var z = pickResult.pickedPoint.z;
    
    var character_x = character.position.x;
    var character_z = character.position.z;
    
    var distance_from_character = Math.sqrt(Math.pow(Math.abs(x-character_x), 2) + Math.pow(Math.abs(z-character_z), 2));
    
    if (pickResult.hit && distance_from_character > radius && Date.now() - lastZombieTime > 1000) {
        lastZombieTime = Date.now();
        
        var materialZombie = new BABYLON.StandardMaterial("texture1", scene);
        materialZombie.diffuseColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        
        var zombie  = BABYLON.Mesh.CreateSphere('zombie', 0, 0.5, scene);
        zombie.checkCollisions = true;
        zombie.material = materialZombie;
        zombie.position.x = x;
        zombie.position.z = z;
        zombie.position.y = 0.5;
        zombies.push(zombie);
    }
}

function update() {
    if (!redemption) {
        updateCharacter();
        updateZombies();
        updateBullets();
    }
    else {
        updateCharacterAfterRedemption();
    }
}

function updateZombies() {
    var character_x = character.position.x;
    var character_z = character.position.z;
    for (var i=0; i<zombies.length; i++) {
        var vector = new BABYLON.Vector2(character_x - zombies[i].position.x, character_z - zombies[i].position.z);
        var norm_vector = vector.normalize();
        zombies[i].position.x += norm_vector.x * zombieMoveSpeed;
        zombies[i].position.z += norm_vector.y * zombieMoveSpeed;
        if (zombies[i].intersectsMesh(character, false)) {
            zombies[i].material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
            
            character_suffer_sound.play();
            
            // show gameover screen
            wait(1000);
            engine.stopRenderLoop();
            document.getElementById("canvas").style.display = 'none';
            document.getElementById("win").style.display = 'none';
            document.getElementById("gameover").style.display = 'block';
        }
    }
}

function updateCharacter() {
    var tempMoveSpeed = charMoveSpeed;
    var wallOffset = 1;
    
    if ((keys.left || keys.right) && (keys.up || keys.down)) {
        tempMoveSpeed /= 1.5;
    }
    
    if (keys.left) {
        direction = 6;
        character.position.x -= tempMoveSpeed;
        if (character.position.x < -groundX/2 + wallOffset) {
            character.position.x = -groundX/2 + wallOffset;
        }
    } 
    else if (keys.right) {
        direction = 2;
        character.position.x += tempMoveSpeed;
        if (character.position.x > groundX/2 - wallOffset) {
            character.position.x = groundX/2 - wallOffset;
        }
    }
    
    if (keys.down) {
        direction = 4;
        if (keys.left)
            direction = 5;
        else if (keys.right)
            direction = 3;

        character.position.z -= tempMoveSpeed;
        if (character.position.z < -groundZ/2 + wallOffset) {
            character.position.z = -groundZ/2 + wallOffset;
        }
    } 
    else if (keys.up) {
        direction = 0;
        if (keys.left)
            direction = 7;
        else if (keys.right)
            direction = 1;
            
        character.position.z += tempMoveSpeed;
        
        if (character.position.z > groundZ/2 - wallOffset) {
            character.position.z = groundZ/2 - wallOffset;
            
            // show winning screen        
            if (doorsDestroyed && character.position.x > -2.5 && character.position.x < 2.5) {
                redemption = true;
                hallelujah_sound.play();
            }
            
        }
    }
    
    character.rotation.y = deg2rad(direction * 45);
}

function updateCharacterAfterRedemption() {
    if (waitFrames < 130) {
        character.position.z += charMoveSpeed;
    }
    else {
        wait(1000);
        engine.stopRenderLoop();
        var body = document.getElementsByTagName('body')[0];
        body.style.backgroundImage = 'url(textures/win_bg.jpg)';
        document.getElementById("canvas").style.display = 'none';
        document.getElementById("gameover").style.display = 'none';
        document.getElementById("win").style.display = 'block';
    }
    waitFrames++;
}

function updateBullets() {
    for (var i=0; i<bullets.length; i++) {
        var direction_x = vector_direction[bullets[i].direction][0];
        var direction_z = vector_direction[bullets[i].direction][1];
        var norm_vector = new BABYLON.Vector2(direction_x, direction_z).normalize();
        bullets[i].position.x += norm_vector.x * bulletMoveSpeed;
        bullets[i].position.z += norm_vector.y * bulletMoveSpeed;
        if (Math.abs(bullets[i].position.x) > groundX/2 || Math.abs(bullets[i].position.z) > groundZ/2) {
            bullets[i].dispose();
            bullets.splice(i, 1);
            i--;
            continue;
        }
        if (!doorsDestroyed && bullets[i].intersectsMesh(holyDoor, false)) {
            doors_shot_sound.play();
            
            doorLife--;
            bullets[i].dispose();
            bullets.splice(i, 1);
            i--;
            if (doorLife <= 0) {
                holyDoor.dispose();
                doorsDestroyed = true;
            }
            continue;
        }
        for (var j = 0; j < zombies.length; j++) {
            if (bullets[i].intersectsMesh(zombies[j], false)) {
                zombie_pain_sound.play();
                
                zombies[j].dispose();
                bullets[i].dispose();
                zombies.splice(j, 1);
                bullets.splice(i, 1);
                i--;
                break;
            }
        }
    }
}

function makeBullet() {
    if (keys.fire && Date.now() - lastFireTime > 1000) {
        lastFireTime = Date.now();
        
        gunshot_sound.play();
        
        var character_x = character.position.x;
        var character_z = character.position.z;
        
        var materialBullet = new BABYLON.StandardMaterial("texture1", scene);
        materialBullet.diffuseColor = new BABYLON.Color3(0.0, 1.0, 0.0);

        var bullet  = BABYLON.Mesh.CreateSphere('bullet', 0, 0.3, scene);
        bullet.material = materialBullet;
        
        bullet.position.x = character_x;
        bullet.position.z = character_z;
        bullet.position.y = 0.5;
        bullet.direction = direction;
        
        bullets.push(bullet);
    }
}

function key_up_or_down(event, bool_value) {
    if (event.keyCode == 65 || event.keyCode == 37) {  
        keys.left = bool_value;
    }
    if (event.keyCode == 68 || event.keyCode == 39) { 
        keys.right = bool_value;    
    }
    if (event.keyCode == 87 || event.keyCode == 38) {
        keys.up = bool_value;  
    }
    if (event.keyCode == 83 || event.keyCode == 40) { 
        keys.down = bool_value;
    } 
    if (event.keyCode == 70 || event.keyCode == 81) {   // F or Q 
        keys.fire = bool_value;
    } 
}

function createScene() {
    var canvas = document.getElementById('canvas');
    engine = new BABYLON.Engine(canvas, true); 
    scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    
    createMusic();
    
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 30,-15), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(60,60,0), scene);
    
    var materialCharacter = new BABYLON.StandardMaterial("texture1", scene);
    materialCharacter.diffuseColor = new BABYLON.Color3(0.0, 0.5, 1.0);
    character = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, tessellation: 10}, scene);
    character.material = materialCharacter;
    character.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    character.position.y = 0.5;
    character.rotation.x = deg2rad(90);
    character.checkCollisions = true;
    
    var materialGround = new BABYLON.StandardMaterial("texture1", scene);
    materialGround.diffuseTexture = new BABYLON.Texture("../textures/graveyard_grass.jpg", scene);
    ground = BABYLON.Mesh.CreateGround('ground1', groundX, groundZ, 2, scene);
    ground.material = materialGround;
    
    var leftWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    leftWall.scaling = new BABYLON.Vector3(1, 2, groundZ);
    leftWall.position = new BABYLON.Vector3(-groundX/2, 1, 0);
    var rightWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    rightWall.scaling = new BABYLON.Vector3(1, 2, groundZ);
    rightWall.position = new BABYLON.Vector3(groundX/2, 1, 0);
    var topLeftWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    topLeftWall.scaling = new BABYLON.Vector3(13, 2, 1);
    topLeftWall.position = new BABYLON.Vector3(-9, 1, groundZ/2);
    var topRightWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    topRightWall.scaling = new BABYLON.Vector3(13, 2, 1);
    topRightWall.position = new BABYLON.Vector3(9, 1, groundZ/2);
    var bottomWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    bottomWall.scaling = new BABYLON.Vector3(groundX+1, 2, 1);
    bottomWall.position = new BABYLON.Vector3(0, 1, -groundZ/2);
    
    var door = BABYLON.Mesh.CreateBox("box", 1, scene);
    door.scaling = new BABYLON.Vector3(5, 2, 1);
    door.position = new BABYLON.Vector3(0, 1, groundZ/2);
    var materialDoor = new BABYLON.StandardMaterial("texture1", scene);
    materialDoor.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    door.material = materialDoor;
    holyDoor = door;
    holyDoor.checkCollisions = true;
}

function createMusic() {
    var ambient_music = new BABYLON.Sound("Ambient_music", "../sounds/creepy_music.mp3", scene, null, { loop: true, autoplay: true });
    gunshot_sound = new BABYLON.Sound("Gunshot", "../sounds/gunshot.wav", scene);
    zombie_pain_sound = new BABYLON.Sound("Zombie_pain", "../sounds/zombie_pain.wav", scene);
    character_suffer_sound = new BABYLON.Sound("Character_sound", "../sounds/character_suffer.wav", scene);
    hallelujah_sound = new BABYLON.Sound("Hallelujah", "../sounds/hallelujah.mp3", scene);
    doors_shot_sound = new BABYLON.Sound("Doors_shot", "../sounds/doors_shot.wav", scene);
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function deg2rad(deg) {
    return deg / 180 * Math.PI;
}