// Global Variables
var viewport = document.getElementById('viewport');
var mainScreen = document.getElementById('main-screen');
var pauseMenu = document.getElementById('pause-menu');
var notification = document.getElementById('notification');
var notificationText = notification.querySelector('.text');
var playerModel = [];
var mapModel;
var renderer = new THREE.WebGLRenderer({
  canvas: viewport,
  antialias: true,
  dithering: true,
});
var composer = new THREE.EffectComposer(renderer);
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var clock = new THREE.Clock();
var characters = [
  {
    name: 'Hank',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.1,
    height: 1.8,
  },
  {
    name: 'Sara',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.15,
    height: 1.78,
  },
  {
    name: 'Mike',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.2,
    height: 1.93,
  },
];
var currentCharacterIndex = 0;
var characterMeshes = [];
var buttonSequence = ['Q', 'T', 'E', 'G'];
var currentButton = 0;
var QTEActive = false;
var qteCircle = document.getElementById('qte-circle');
var qteCircleKey = qteCircle.querySelector('.button');
var SOUND_QTE_WARN = new Audio('/resources/qte_warn.wav');
var SOUND_QTE_FAIL = new Audio('/resources/qte_fail.mp3');
var sunlight = new THREE.DirectionalLight(0xffe0c0, 1.0);
var motionBlurPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
var cutsceneActive = false;
var audio = new Audio();
var subtitle = document.getElementById('subtitle');
var startTime;
var isSlowMotion = false;
var cameraRotation = { x: 0, y: 0 };
var playerMovement = new THREE.Vector3();
var inventory = {};
var gameSpeed = 1;
var music = new Audio();
var currentTrack = 0;
var tracks = [
  {
    title: 'Track1',
    src: 'resources/music/track1.mp3',
  },
  {
    title: 'Track2',
    src: 'resources/music/track2.mp3',
  },
  {
    title: 'Track3',
    src: 'resources/music/track3.mp3',
  },
];
var choices = [
  { text: 'Option 1', result: 'outcome1' },
  { text: 'Option 2', result: 'outcome2' },
  { text: 'Option 3', result: 'outcome3' },
];
var choiceStartTime;
var choiceDuration = 10000; // 10 seconds
let target = new THREE.Vector3();
let mouse = new THREE.Vector2();
let mouseSensitivity = 0.1;
let interpolationFactor = 0.1;

// Initialize the renderer
renderer.setSize(window.innerWidth, window.innerHeight);

// Initialize the camera
camera.position.y = 10;
camera.position.z = 10;

// Initialize the composer
composer.addPass(new THREE.RenderPass(scene, camera));
// composer.addPass(motionBlurPass);

// Add the player model
var characterLoader = new THREE.GLTFLoader();
characters.forEach((character, index) => {
  characterLoader.load(character.model, function (geometry) {
    var mesh = geometry.scene;
    playerModel[index] = mesh;
    playerModel[index].receiveShadow = true;
    playerModel[index].castShadow = true;
    playerModel[index].position.x = index * 3;
    characterMeshes.push(mesh);
    scene.add(mesh);

    console.log(index, ': ', playerModel[index]);
  });
});

// Add the map
var mapLoader = new THREE.GLTFLoader();
mapLoader.load('resources/map/model.glb', function (geometry) {
  mapModel = geometry.scene;
  mapModel.receiveShadow = true;
  mapModel.castShadow = true;
  // mapModel.add(new THREE.Box3Helper(mapModel.geometry.boundingBox));
  scene.add(mapModel);
});

// Add the sunlight
sunlight.position.set(0, 10, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 500;
scene.add(sunlight);

// Add the fog
scene.fog = new THREE.FogExp2(0x004080, 0.002);

// Add the event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('keydown', checkButtonPress);
document.addEventListener('mousedown', onMouseDown, false);
document.addEventListener('mousemove', onMouseMove, false);
document.addEventListener('pointerlockchange', onPointerLockChange, false);
document.addEventListener('pointerlockerror', onPointerLockError, false);

// Add the render loop
function render() {
  requestAnimationFrame(render);
  var delta = clock.getDelta();
  renderer.render(scene, camera);
  composer.render(delta);

  // Use lerp() to interpolate between the current and target position
  camera.position.lerp(target, interpolationFactor);
  camera.lookAt(target);

  // Update the camera rotation based on the mouse movement
  playerModel[currentCharacterIndex].rotation.y += camera.rotation.y;

  console.log(camera.rotation.x, camera.rotation.y, camera.rotation.z);

  // Update the player position based on the current movement
  if (document.pointerLockElement === viewport) {
    playerModel[currentCharacterIndex].translateX(playerMovement.x * speed);
    playerModel[currentCharacterIndex].translateZ(playerMovement.z * speed);
    camera.translateX(playerMovement.x * speed);
    camera.translateZ(playerMovement.z * speed);
    playerMovement.set(0, 0, 0);
  }

  // Update the camera position to follow the player
  // camera.position.x = playerModel[currentCharacterIndex].position.x;
  // camera.position.y = playerModel[currentCharacterIndex].position.y + 2;
  // camera.position.z = playerModel[currentCharacterIndex].position.z - 5;
}
render();

// Add the QTE functions
function startQTE(x, y) {
  if (!QTEActive) {
    QTEActive = true;
    currentButton = 0;
    qteCircleKey.textContent = buttonSequence[currentButton];
    qteCircle.classList.add('visible');
    qteCircle.style.left = x;
    qteCircle.style.top = y;
    SOUND_QTE_WARN.currentTime = 0;
    SOUND_QTE_WARN.play();
    timeoutId = setTimeout(function () {
      if (QTEActive) {
        qteCircle.classList.add('failed');
        SOUND_QTE_FAIL.currentTime = 0;
        SOUND_QTE_FAIL.play();
        setTimeout(function () {
          qteCircle.classList.remove('visible');
          qteCircle.classList.remove('failed');
        }, 1000);
        QTEActive = false;
        // failure action here
      }
    }, 3000);
  }
}

function checkButtonPress(event) {
  if (QTEActive && event.key === buttonSequence[currentButton].toLowerCase()) {
    currentButton++;
    if (currentButton === buttonSequence.length) {
      clearTimeout(timeoutId);
      qteCircle.classList.add('success');
      setTimeout(function () {
        qteCircle.classList.remove('visible');
        qteCircle.classList.remove('success');
      }, 1000);
      QTEActive = false;
      // success action here
    } else {
      qteCircleKey.textContent = buttonSequence[currentButton];
      SOUND_QTE_WARN.currentTime = 0;
      SOUND_QTE_WARN.play();
      qteCircle.classList.add('active');
      setTimeout(function () {
        qteCircle.classList.remove('active');
      }, 100);
    }
  } else {
    if (qteCircle.classList.contains('visible')) {
      clearTimeout(timeoutId);
      qteCircle.classList.add('failed');
      SOUND_QTE_FAIL.currentTime = 0;
      SOUND_QTE_FAIL.play();
      setTimeout(function () {
        qteCircle.classList.remove('visible');
        qteCircle.classList.remove('failed');
      }, 1000);
      QTEActive = false;
      // failure action here
    }
  }
}

// Add the character switching function
function switchCharacter(index) {
  currentCharacterIndex = index;

  // Make the animation start a second after the slow motion.
  setTimeout(() => {
    // Set the start time of the animation
    startTime = Date.now();

    animate();
    showCharacterInfo(characters[index]);
  }, 1000);

  // Get the current position and rotation of the camera
  var startPosition = camera.position.clone();
  var startRotation = camera.rotation.clone();

  // Get the position and rotation of the next character
  var endPosition = characterMeshes[index].position.clone();
  var endRotation = characterMeshes[index].rotation.clone();

  // Set the duration of the animation
  var duration = 2000;

  // Trigger a slow motion effect
  slowMotion(duration);

  // Set the cubic-bezier values for the animation
  var easing = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0.25, 0.1, 0.25),
    new THREE.Vector3(0.1, 1, 0.25),
    new THREE.Vector3(1, 1, 0.25),
    new THREE.Vector3(1, 0, 0.25)
  );

  // Start the animation loop
  function animate() {
    // Calculate the progress of the animation
    var currentTime = Date.now();
    var elapsedTime = currentTime - startTime;
    var progress = elapsedTime / duration; // duration is the desired duration of the animation

    // Apply the custom easing function to the progress value
    var point = easing.getPoint(progress);

    // Update the camera's position and rotation based on the progress value
    camera.position.x =
      startPosition.x + (endPosition.x - startPosition.x) * point.x;
    camera.position.y =
      startPosition.y + (endPosition.y - startPosition.y) * point.y;
    camera.position.z =
      startPosition.z + (endPosition.z - startPosition.z) * point.z;

    camera.lookAt(characterMeshes[index].position);

    // Repeat the animation loop if the animation is not finished
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
}

function showCharacterInfo(data) {
  var hudInfo = document.getElementById('hud-info');
  var characterName = hudInfo.querySelector('.character');
  var inGameTime = hudInfo.querySelector('.time');
  var inGameProgress = hudInfo.querySelector('.progress');
  hudInfo.classList.add('visible');
  characterName.textContent = data.name;
  inGameTime.textContent = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  setTimeout(() => {
    hudInfo.classList.remove('visible');
  }, 3000);
}

// Add the slow mo function
function slowMotion(duration) {
  if (!isSlowMotion) {
    isSlowMotion = true;
    gameSpeed = 0.2;
    setTimeout(function () {
      isSlowMotion = false;
      gameSpeed = 1;
    }, duration);
  }
}

// Add the ingame notifiers function
function showNotifier(message, type) {
  notificationText.textContent = message;
  notification.classList.add(type);
  notification.classList.add('visible');
  setTimeout(function () {
    notification.classList.remove('visible');
    notification.classList.remove(type);
  }, 2000);
}

// Add the audio and subtitles function
function playAudioWithSubtitle(audioSrc, text) {
  audio.src = audioSrc;
  subtitle.textContent = text;
  audio.play();
  audio.onended = () => {
    subtitle.textContent = ''; // clear the subtitle text
  };
}

// Add the cutscene function
function startCutscene(cutscene) {
  if (!cutsceneActive) {
    cutsceneActive = true;
    // Disable player controls
    document.removeEventListener('keydown', playerControls);
    document.removeEventListener('mousemove', playerControls);
    // Move camera to cutscene start position
    camera.position.set(
      cutscene.startPosition.x,
      cutscene.startPosition.y,
      cutscene.startPosition.z
    );
    // Play cutscene animation or audio
    cutscene.animation.play();
    // After cutscene ends
    setTimeout(function () {
      // Enable player controls
      document.addEventListener('keydown', playerControls);
      document.addEventListener('mousemove', playerControls);
      // Move camera back to player position
      camera.position.set(
        player.position.x,
        player.position.y,
        player.position.z
      );
      cutsceneActive = false;
    }, cutscene.duration);
  }
}

// Add the pause and main menu functions
function togglePauseMenu() {
  pauseMenu.classList.toggle('visible');
  if (pauseMenu.classList.contains('visible')) {
    // pause the game
  } else {
    // resume the game
  }
}
function showMainMenu() {
  mainScreen.classList.add('visible');
}

// Add the freeze and unfreeze function
function toggleFreeze() {
  if (gameFrozen) {
    gameFrozen = false;
    // Enable player controls
    document.addEventListener('keydown', playerControls);
    document.addEventListener('mousemove', playerControls);
    // Start game loop
    requestId = requestAnimationFrame(gameLoop);
  } else {
    gameFrozen = true;
    // Disable player controls
    document.removeEventListener('keydown', playerControls);
    document.removeEventListener('mousemove', playerControls);
    // Stop game loop
    cancelAnimationFrame(requestId);
  }
}

// Create a function to add an item to the inventory
function addItemToInventory(item) {
  if (!inventory[currentCharacterIndex]) {
    inventory[currentCharacterIndex] = [];
  }
  inventory[currentCharacterIndex].push(item);
  updateInventoryDisplay();
}

// Create a function to remove an item from the inventory
function removeItemFromInventory(item) {
  if (!inventory[currentCharacterIndex]) {
    inventory[currentCharacterIndex] = [];
  }
  var index = inventory[currentCharacterIndex].indexOf(item);
  if (index !== -1) {
    inventory[currentCharacterIndex].splice(index, 1);
    updateInventoryDisplay();
  }
}

// Create a function to update the display of the inventory
function updateInventoryDisplay() {
  if (!inventory[currentCharacterIndex]) {
    inventory[currentCharacterIndex] = [];
  }
  var inventoryDiv = document.getElementById('inventory');
  inventoryDiv.innerHTML = '';
  for (var i = 0; i < inventory[currentCharacterIndex].length; i++) {
    var itemDiv = document.createElement('div');
    itemDiv.classList.add('inventory-item');
    itemDiv.innerHTML = inventory[currentCharacterIndex][i];
    inventoryDiv.appendChild(itemDiv);
  }
}

// Define the cubic-bezier function
function cubicBezier(x1, y1, x2, y2) {
  return function (t) {
    var cx = 3.0 * x1,
      bx = 3.0 * (x2 - x1) - cx,
      ax = 1.0 - cx - bx,
      cy = 3.0 * y1,
      by = 3.0 * (y2 - y1) - cy,
      ay = 1.0 - cy - by;

    function sampleCurveX(t) {
      return ((ax * t + bx) * t + cx) * t;
    }
    function sampleCurveY(t) {
      return ((ay * t + by) * t + cy) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }

    // Newton raphson iteration
    var epsilon = 0.00001,
      d,
      t0,
      t1;
    for (t0 = t, t1 = 0; t0 < 1.0; t1 = t0) {
      d = sampleCurveX(t0) - t;
      if (Math.abs(d) < epsilon) {
        return sampleCurveY(t0);
      }
      t0 = t0 - d / sampleCurveDerivativeX(t0);
    }
    // Fall back to the bisection method for reliability.
    t0 = 0;
    t1 = 1;
    t = t1;
    for (; t0 < t1; ) {
      d = sampleCurveX(t);
      if (Math.abs(d - t) < epsilon) {
        return sampleCurveY(t);
      }
      if (t > d) {
        t0 = t;
      } else {
        t1 = t;
      }
      t = (t1 - t0) * 0.5 + t0;
    }
    // Failure.
    return sampleCurveY(t);
  };
}

function displayChoices() {
  // Get the timer progress bar
  var choiceTimerProgress = document.getElementById('timer-progress-bar');

  // Set up choice timer
  var timer = choiceDuration;
  var intervalId = setInterval(() => {
    timer -= 10;
    var progress = timer / choiceDuration;
    choiceTimerProgress.style.setProperty('--progress', progress);
    if (timer <= 1) {
      handleChoice('silent');
      clearInterval(intervalId);
    }
  }, 10);

  // Clear any existing choices
  var choiceContainer = document.getElementById('choice-container');
  choiceContainer.classList.add('visible');

  var choiceButtons = choiceContainer.querySelector('.choices');
  choiceButtons.innerHTML = '';

  // Add the new choices to the container
  choices.forEach((choice) => {
    var button = document.createElement('button');
    button.textContent = choice.text;
    button.addEventListener('click', function () {
      handleChoice(choice.result);
      clearInterval(intervalId);
    });
    choiceButtons.appendChild(button);
  });
}

function handleChoice(result) {
  // Hide the choice menu
  var choiceContainer = document.getElementById('choice-container');
  choiceContainer.classList.remove('visible');

  // Do something based on the outcome of the choice
  if (result === 'outcome1') {
    // Outcome 1
  } else if (result === 'outcome2') {
    // Outcome 2
  } else if (result === 'outcome3') {
    // Outcome 3
  }
}

function onMouseDown() {
  viewport.requestPointerLock();
}

function onMouseMove(event) {
  if (document.pointerLockElement === viewport) {
    // Update the mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Calculate the target position based on the mouse position
    target.x = - mouse.x * mouseSensitivity;
    target.y = mouse.y * mouseSensitivity;
  }
}

function onPointerLockChange() {
  if (document.pointerLockElement === viewport) {
    // Pointer was just locked
    // Enable mouse move event listener
  } else {
    // Pointer was just unlocked
    // Disable mouse move event listener
  }
}

function onPointerLockError() {
  // Handle error here
}

// Create an onKeyDown function to update the player movement and camera rotation when a key is pressed
function onKeyDown(event) {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
      playerMovement.z = -1;
      break;
    case 's':
    case 'ArrowDown':
      playerMovement.z = 1;
      break;
    case 'a':
    case 'ArrowLeft':
      playerMovement.x = -1;
      break;
    case 'd':
    case 'ArrowRight':
      playerMovement.x = 1;
      break;
    case ' ':
      playerMovement.y = 1;
      break;
  }
}

// Create an onKeyUp function to update the player movement and camera rotation when a key is released
function onKeyUp(event) {
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
    case 's':
    case 'ArrowDown':
      playerMovement.z = 0;
      break;
    case 'a':
    case 'ArrowLeft':
    case 'd':
    case 'ArrowRight':
      playerMovement.x = 0;
      break;
    case ' ':
      playerMovement.y = 0;
      break;
  }
}
