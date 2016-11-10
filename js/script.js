window.addEventListener('DOMContentLoaded', main);

function main() {
    var canvas = document.getElementById('canvas');
    var engine = new BABYLON.Engine(canvas, true);
    var character;
    var charMoveSpeed = 0.03;
    
    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 20,-15), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
        character = BABYLON.Mesh.CreateSphere('sphere1', 16, 0.7, scene);
        character.position.y = 1;
        var ground = BABYLON.Mesh.CreateGround('ground1', 25, 18, 2, scene);
    
        return scene;
    }
    
    var scene = createScene();
    
    engine.runRenderLoop(function() {
        scene.render();
    });

    window.addEventListener('resize', function() {
        engine.resize();
    });
    
    var keys = { letft:false, right:false, up:false, down:false };
    
    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("keyup", onKeyUp, false);
    
    function onKeyDown(event) {    
        if (event.keyCode == 65 || event.keyCode == 37) {  
            keys.left = true;
        }
        if (event.keyCode == 68 || event.keyCode == 39) { 
            keys.right = true;    
        }
        if (event.keyCode == 87 || event.keyCode == 38) {
            keys.up = true;  
        }
        if (event.keyCode == 83 || event.keyCode == 40) { 
            keys.down = true;
        } 
    }
    
    function onKeyUp(event) {  
        if (event.keyCode == 65 || event.keyCode == 37) { 
            keys.left = false;
        }
        if (event.keyCode == 68 || event.keyCode == 39) {
            keys.right = false;    
        }
        if (event.keyCode == 87 || event.keyCode == 38) {
            keys.up = false;  
        }
        if (event.keyCode == 83 || event.keyCode == 40) {
            keys.down = false;
        } 
    }
    
    engine.runRenderLoop(function () {   
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
    });
}
    