window.addEventListener('DOMContentLoaded', main);

var keys = { letft:false, right:false, up:false, down:false };
var engine, scene, light, character;
var charMoveSpeed = 0.1;


function main(){
    createScene();
    
    engine.runRenderLoop(function() {
        scene.render();
    });

    window.addEventListener('resize', function() { engine.resize(); });
    
    window.addEventListener("keydown", function() { key_up_or_down(event, true); });
    window.addEventListener("keyup", function() { key_up_or_down(event, false); });
    
    window.addEventListener("click", mouseClick);
    engine.runRenderLoop(updatePosition);
    
    // ob kliku na character se celotna scena v 1000 ms obarva zeleno
    character.actionManager = new BABYLON.ActionManager(scene);
	character.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, light, "diffuse", BABYLON.Color3.Green(), 1000))

}

function mouseClick() {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY);
    if (pickResult.hit) {
        var square  = BABYLON.Mesh.CreateSphere('square', 16, 1, scene);
        square.position.x = pickResult.pickedPoint.x;
        square.position.z = pickResult.pickedPoint.z;
    }
}

function createScene() {
    var canvas = document.getElementById('canvas');
    engine = new BABYLON.Engine(canvas, true); 
    scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 20,-15), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
    character = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, tessellation: 4}, scene);
    character.position.y = 3;
    var ground = BABYLON.Mesh.CreateGround('ground1', 25, 18, 2, scene);
}


function updatePosition() {
    var tempMoveSpeed = charMoveSpeed;
    if ((keys.left || keys.right) && (keys.up || keys.down)) {
        tempMoveSpeed /= 1.5;
    }
    if (keys.left) {
        character.position.x -= tempMoveSpeed;
    }
    if (keys.right) {
        character.position.x += tempMoveSpeed;
    }
    if (keys.up) {
        character.position.z += tempMoveSpeed;
    }
    if (keys.down) {
        character.position.z -= tempMoveSpeed;
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
}