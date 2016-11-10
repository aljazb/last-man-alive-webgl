window.addEventListener('DOMContentLoaded', main);

var keys = { letft:false, right:false, up:false, down:false };
var engine, scene, light, character, ground;
var charMoveSpeed = 0.05;
var zombieMoveSpeed = 0.01;
var radius = 3;
var direction = 0;
var zombies = [];
var groundX = 30;
var groundZ = 25;

function main(){
    createScene();
    
    engine.runRenderLoop(function() {
        scene.render();
    });

    window.addEventListener('resize', function() { engine.resize(); });
    
    window.addEventListener("keydown", function() { key_up_or_down(event, true); });
    window.addEventListener("keyup", function() { key_up_or_down(event, false); });
    
    window.addEventListener("click", mouseClick);
    
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
    
    if (pickResult.hit && distance_from_character > radius) {
        var zombie  = BABYLON.Mesh.CreateSphere('zombie', 0, 0.5, scene);
        zombie.position.x = x;
        zombie.position.z = z;
        
        zombies.push(zombie);
    }
    
    console.log(zombies);
}

function deg2rad(deg) {
    return deg / 180 * Math.PI;
}

function createScene() {
    var canvas = document.getElementById('canvas');
    engine = new BABYLON.Engine(canvas, true); 
    scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 30,-15), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
    character = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, tessellation: 10}, scene);
    character.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    character.position.y = 0.5;
    character.rotation.x = deg2rad(90);
    ground = BABYLON.Mesh.CreateGround('ground1', groundX, groundZ, 2, scene);
}

function update() {
    updateCharacter();
    updateZombies();
}

function updateZombies() {
    var character_x = character.position.x;
    var character_z = character.position.z;
    for (var i=0; i<zombies.length; i++) {
        var vector = new BABYLON.Vector2(character_x - zombies[i].position.x, character_z - zombies[i].position.z);
        var norm_vector = vector.normalize();
        zombies[i].position.x += norm_vector.x * zombieMoveSpeed;
        zombies[i].position.z += norm_vector.y * zombieMoveSpeed;
    }
}

function updateCharacter() {
    var tempMoveSpeed = charMoveSpeed;
    if ((keys.left || keys.right) && (keys.up || keys.down)) {
        tempMoveSpeed /= 1.5;
    }
    
    if (keys.left) {
        direction = 6;
        character.position.x -= tempMoveSpeed;
    } 
    else if (keys.right) {
        direction = 2;
        character.position.x += tempMoveSpeed;
    }
    
    if (keys.down) {
        direction = 4;
        if (keys.left)
            direction = 5;
        else if (keys.right)
            direction = 3;

        character.position.z -= tempMoveSpeed;
    } 
    else if (keys.up) {
        direction = 0;
        if (keys.left)
            direction = 7;
        else if (keys.right)
            direction = 1;

        character.position.z += tempMoveSpeed;
    }
    
    character.rotation.y = deg2rad(direction * 45);
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
}