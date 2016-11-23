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
var holyDoorLeft;
var holyDoorRight;
var fakeDoor;
var doorLife = 3;
var groundX = 30;
var groundZ = 25;
var lastFireTime = Date.now();
var lastZombieTime = Date.now();
var doorsDestroyed = false;
var waitFrames = 0;
var redemption = false;
var gunshot_sound, zombie_pain_sound, character_suffer_sound, hallelujah_sound, doors_shot_sound;
var zombie = [];
var characterModels = [];
var characterPositionX = 0;
var characterPositionZ = 0;


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
}

function mouseClick() {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY);
    var x = pickResult.pickedPoint.x;
    var z = pickResult.pickedPoint.z;
    
    var character_x = characterPositionX;
    var character_z = characterPositionZ;
    
    var distance_from_character = Math.sqrt(Math.pow(Math.abs(x-character_x), 2) + Math.pow(Math.abs(z-character_z), 2));
    
    if (pickResult.hit && distance_from_character > radius && Date.now() - lastZombieTime > 1000) {
        lastZombieTime = Date.now();
        
        var materialZombie = new BABYLON.StandardMaterial("texture1", scene);
        materialZombie.diffuseColor = new BABYLON.Color3(0.0, 0.5, 0.0);
        
        var zombie = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, tessellation: 5}, scene);
        zombie.checkCollisions = true;
        zombie.material = materialZombie;
        zombie.position.x = x;
        zombie.position.z = z;
        zombie.position.y = 0.5;
        zombie.rotation.x = deg2rad(90);
        zombies.push(zombie);
        // BABYLON.SceneLoader.ImportMesh("", "", "zombie.babylon", scene, function (newMeshes, particleSystems) {
        //     var zombieModels = newMeshes;
        //     zombies.push(zombieModels);
        // });
        
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
    var character_x = characterPositionX;
    var character_z = characterPositionZ;
    for (var i=0; i<zombies.length; i++) {
        var vector = new BABYLON.Vector2(character_x - zombies[i].position.x, character_z - zombies[i].position.z);
        var norm_vector = vector.normalize();
        
        zombies[i].position.x += norm_vector.x * zombieMoveSpeed;
        zombies[i].position.z += norm_vector.y * zombieMoveSpeed;
        
        var angle = Math.atan2(norm_vector.x, norm_vector.y);
        zombies[i].rotation.y = angle;
        
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
        moveCharacter(-tempMoveSpeed, 0);
        
        if (characterModels[0].position.x < -groundX/2 + wallOffset) {
            moveCharacterToPoint(-groundX/2 + wallOffset, characterModels[0].position.z);
        }
    } 
    else if (keys.right) {
        direction = 2;
        moveCharacter(tempMoveSpeed, 0);
        
        if (characterModels[0].position.x > groundX/2 - wallOffset) {
            moveCharacterToPoint(groundX/2 - wallOffset, characterModels[0].position.z);
        }
    }
    
    if (keys.down) {
        direction = 4;
        if (keys.left)
            direction = 5;
        else if (keys.right)
            direction = 3;

        moveCharacter(0, -tempMoveSpeed);
        
        if (characterModels[0].position.z < -groundZ/2 + wallOffset * 2) {
            moveCharacterToPoint(characterModels[0].position.x, -groundZ/2 + wallOffset * 2);
        }
    } 
    else if (keys.up) {
        direction = 0;
        if (keys.left)
            direction = 7;
        else if (keys.right)
            direction = 1;
            
        
        moveCharacter(0, tempMoveSpeed);
        
        if (characterModels[0].position.z > groundZ/2 - wallOffset) {
            moveCharacterToPoint(characterModels[0].position.x, groundZ/2 - wallOffset);
            
            // show winning screen        
            if (doorsDestroyed && characterModels[0].position.x > -2.5 && characterModels[0].position.x < 2.5) {
                redemption = true;
                hallelujah_sound.play();
            }
            
        }
    }
    
    if (characterModels[0]) {
        characterPositionX = characterModels[0].position.x;
        characterPositionZ = characterModels[0].position.z;
    }
    
    for (var i = 0; i < characterModels.length; i++) {
        characterModels[i].rotation.y = deg2rad(direction * 45 + 180);
    }
}

function moveCharacter(x, z) {
    for (var i = 0; i < characterModels.length; i++) {
        characterModels[i].position.z += z;
        characterModels[i].position.x += x;
    }
}

function moveCharacterToPoint(x, z) {
    for (var i = 0; i < characterModels.length; i++) {
        characterModels[i].position.z = z;
        characterModels[i].position.x = x;
    }
}

function updateCharacterAfterRedemption() {
    if (waitFrames < 130) {
        moveCharacter(0, charMoveSpeed);
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
        if (Math.abs(bullets[i].position.x) > groundX/2 || bullets[i].position.z > groundZ/2+2.8 || bullets[i].position.z < -groundZ/2) {
            bullets[i].dispose();
            bullets.splice(i, 1);
            i--;
            continue;
        }
        if (!doorsDestroyed && bullets[i].intersectsMesh(fakeDoor, false)) {
            doors_shot_sound.play();
            doorLife--;
            bullets[i].dispose();
            bullets.splice(i, 1);
            i--;
            if (doorLife <= 0) {
                fakeDoor.dispose();
                holyDoorLeft.rotation.y = deg2rad(80);
                holyDoorLeft.position.x -= 1;
                holyDoorLeft.position.z -= 0.7;
                
                holyDoorRight.rotation.y = deg2rad(100);
                holyDoorRight.position.x += 1;
                holyDoorRight.position.z -= 0.7;
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
        
        var character_x = characterModels[0].position.x;
        var character_z = characterModels[0].position.z;
        
        var materialBullet = new BABYLON.StandardMaterial("texture1", scene);
        materialBullet.diffuseColor = new BABYLON.Color3(0.0, 1.0, 0.0);

        var bullet  = BABYLON.Mesh.CreateSphere('bullet', 0, 0.3, scene);
        bullet.material = materialBullet;
        
        bullet.position.x = character_x;
        bullet.position.z = character_z;
        bullet.position.y = 2;
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
    character.scaling = new BABYLON.Vector3(0, 0, 0);
    
    var materialGround = new BABYLON.StandardMaterial("texture1", scene);
    materialGround.diffuseTexture = new BABYLON.Texture("../textures/ground.png", scene);
    ground = BABYLON.Mesh.CreateGround('ground1', groundX, groundZ, 2, scene);
    ground.material = materialGround;
    
    // var leftWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    // leftWall.scaling = new BABYLON.Vector3(1, 2, groundZ);
    // leftWall.position = new BABYLON.Vector3(-groundX/2, 1, 0);
    // var rightWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    // rightWall.scaling = new BABYLON.Vector3(1, 2, groundZ);
    // rightWall.position = new BABYLON.Vector3(groundX/2, 1, 0);
    // var topLeftWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    // topLeftWall.scaling = new BABYLON.Vector3(13, 2, 1);
    // topLeftWall.position = new BABYLON.Vector3(-9, 1, groundZ/2);
    // var topRightWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    // topRightWall.scaling = new BABYLON.Vector3(13, 2, 1);
    // topRightWall.position = new BABYLON.Vector3(9, 1, groundZ/2);
    // var bottomWall = BABYLON.Mesh.CreateBox("box", 1, scene);
    // bottomWall.scaling = new BABYLON.Vector3(groundX+1, 2, 1);
    // bottomWall.position = new BABYLON.Vector3(0, 1, -groundZ/2);
    
    // var materialDoor = new BABYLON.StandardMaterial("texture1", scene);
    // materialDoor.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    // door.material = materialDoor;
    fakeDoor = BABYLON.Mesh.CreateBox("box", 1, scene);
    
    BABYLON.SceneLoader.ImportMesh("", "", "obzidje.babylon", scene, function (newMeshes, particleSystems) {
        holyDoorLeft = newMeshes[0];
        holyDoorRight = newMeshes[5];
        
        fakeDoor.scaling = new BABYLON.Vector3(4, 1, 0.1);
        fakeDoor.position = new BABYLON.Vector3(-0.5, 2, groundZ/2 + 0.75);
    });
    
    BABYLON.SceneLoader.ImportMesh("", "", "character.babylon", scene, function (newMeshes, particleSystems) {
       characterModels = newMeshes;
    });
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