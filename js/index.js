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
    name: 'Dingus',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.1,
    height: 1.8,
    yaw: 0,
    pitch: 0,
    camera: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  },
  {
    name: 'Big',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.15,
    height: 1.78,
    yaw: 0,
    pitch: 0,
    camera: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  },
  {
    name: 'Chungus',
    model: 'resources/characters/generic/model.gltf',
    speed: 0.2,
    height: 1.93,
    yaw: 0,
    pitch: 0,
    camera: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  },
];
var currentCharacterIndex = 0;
var characterMeshes = [];
var buttonSequence = ['Q', 'T', 'E', 'G'];
var currentButton = 0;
var QTEActive = false;
var qteCircle = document.getElementById('qte-circle');
var qteCircleKey = qteCircle.querySelector('.button');
var SOUND_QTE_APPEAR = new Audio('resources/qte_appear.wav');
var SOUND_QTE_TICKING = new Audio('resources/qte_ticking_normal.wav');
var SOUND_QTE_FAIL = new Audio('resources/qte_fail.wav');
var SOUND_CAMERA_WHOOSH = new Audio('resources/whoosh.wav');
var sunlight = new THREE.DirectionalLight(0xffe0c0, 1.0);
var unrealBloomPass = new THREE.UnrealBloomPass(
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
var sensitivity = 0.01;
var qteTimer = document.getElementById('qte-timer');
var qteTimerTrack = document.getElementById('qte-timer-track');
var qteTimerFill = document.getElementById('qte-timer-fill');
var speed = 0.75;
var skyColor = 0x212325;
var isInGamePlaying = false;
var keyboardControlFlags = {};
var isCharacterSwitching = false;
var pitchEasing = 0.05;
var yawEasing = 0.05;
var boundingBoxes = [];
const jumpForce = 1;
var isJumping = false;
var jumpSpeed = 0;
var collidableMeshList = [];
var gravity = 0.05;

// Set up the bloom
unrealBloomPass.exposure = 2;
unrealBloomPass.bloomThreshold = 0;
unrealBloomPass.bloomStrength = 2;
unrealBloomPass.bloomRadius = 1;

// Initialize the renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;

// Initialize the camera
camera.position.y = 10;
camera.position.z = 10;

// Initialize the composer
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new THREE.RenderPass(scene, camera));
composer.addPass(unrealBloomPass);

// Add the player model
var characterLoader = new THREE.GLTFLoader();
characters.forEach((character, index) => {
  characterLoader.load(character.model, function (geometry) {
    var mesh = geometry.scene;
    playerModel[index] = mesh;
    playerModel[index].receiveShadow = true;
    playerModel[index].castShadow = true;
    playerModel[index].position.x = index * 15;

    var box = new THREE.Box3();

    // Pass the geometry to the Box3 object
    box.setFromObject(playerModel[index]);

    playerModel[index].add(new THREE.Box3Helper(box));
    boundingBoxes.push(box);
    collidableMeshList.push(playerModel[index]);
    playerModel[index].position.y = 1;
    characterMeshes.push(mesh);
    scene.add(mesh);
  });
});

// Add the map
var mapLoader = new THREE.GLTFLoader();
mapLoader.load(
  'resources/maps/apocalyptic_city/scene.gltf',
  function (geometry) {
    mapModel = geometry.scene;
    mapModel.receiveShadow = true;
    mapModel.castShadow = true;
    mapModel.scale.x = 0.15;
    mapModel.scale.y = 0.15;
    mapModel.scale.z = 0.15;

    var box = new THREE.Box3();

    // Pass the geometry to the Box3 object
    box.setFromObject(mapModel);

    mapModel.add(new THREE.Box3Helper(box));
    boundingBoxes.push(box);
    collidableMeshList.push(mapModel);
    scene.add(mapModel);
  }
);

// Add the sunlight
sunlight.position.set(0, 10, 10);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 500;
scene.add(sunlight);

// Add the fog
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.FogExp2(skyColor, 0.0001);

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
  if (!isInGamePlaying) {
    return;
  }
  if (isCharacterSwitching) {
    return;
  }
  if (document.pointerLockElement !== viewport) {
    return;
  }

  // Update the player position based on the current movement
  camera.quaternion.setFromEuler(
    new THREE.Euler(
      characters[currentCharacterIndex].pitch,
      characters[currentCharacterIndex].yaw,
      0,
      'YXZ'
    )
  );

  if (keyboardControlFlags['w']) {
    if (keyboardControlFlags.isShiftActive) {
      camera.translateZ(-speed * 2);
      playerModel[currentCharacterIndex].translateZ(-speed * 2);
      targetFov = 75;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    } else {
      camera.translateZ(-speed);
      playerModel[currentCharacterIndex].translateZ(-speed);
      targetFov = 70;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    }
  }
  if (keyboardControlFlags['s']) {
    camera.translateZ(speed);
    playerModel[currentCharacterIndex].translateZ(speed);
  }
  if (keyboardControlFlags['a']) {
    if (keyboardControlFlags.isShiftActive) {
      camera.translateX(-speed * 2);
      playerModel[currentCharacterIndex].translateX(-speed * 2);
      targetFov = 75;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    } else {
      camera.translateX(-speed);
      playerModel[currentCharacterIndex].translateX(-speed);
      targetFov = 70;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    }
  }
  if (keyboardControlFlags['d']) {
    if (keyboardControlFlags.isShiftActive) {
      camera.translateX(speed * 2);
      playerModel[currentCharacterIndex].translateX(speed * 2);
      targetFov = 75;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    } else {
      camera.translateX(speed);
      playerModel[currentCharacterIndex].translateX(speed);
      targetFov = 70;
      camera.fov += (targetFov - camera.fov) * delta * 10;
      camera.updateProjectionMatrix();
    }
  }
  if (keyboardControlFlags[' '] && !isJumping) {
    jumpSpeed = jumpForce;
    isJumping = true;
  }

  if (isJumping) {
    playerModel[currentCharacterIndex].position.y += jumpSpeed;
    jumpSpeed -= gravity;

    // Check if the player has hit the ground
    var raycaster = new THREE.Raycaster(
      playerModel[currentCharacterIndex].position,
      new THREE.Vector3(0, -1, 0)
    );
    var intersects = raycaster.intersectObjects(collidableMeshList);
    if (intersects.length > 0) {
      playerModel[currentCharacterIndex].position.y = intersects[0].point.y + 1;
      isJumping = false;
    }
  }

  characters[currentCharacterIndex].camera.rotation.x = camera.rotation.x;
  characters[currentCharacterIndex].camera.rotation.y = camera.rotation.y;
  characters[currentCharacterIndex].camera.rotation.z = camera.rotation.z;
  characters[currentCharacterIndex].camera.position.x = camera.position.x;
  characters[currentCharacterIndex].camera.position.y = camera.position.y;
  characters[currentCharacterIndex].camera.position.z = camera.position.z;
  playerModel[currentCharacterIndex].rotation.y =
    characters[currentCharacterIndex].yaw;

  // Update the camera position to follow the player
  camera.position.x = playerModel[currentCharacterIndex].position.x;
  camera.position.y = playerModel[currentCharacterIndex].position.y + 3.5;
  camera.position.z = playerModel[currentCharacterIndex].position.z;
  camera.translateX(2);
  camera.translateZ(3.5);
}
render();

// Add the QTE functions
var timeoutId,
  intervalId,
  timer = 0;

function startQTE(
  type,
  x,
  y,
  { duration, isButtonMash } = { duration: 3000, isButtonMash: false }
) {
  if (!QTEActive) {
    QTEActive = true;
    currentButton = 0;
    qteCircleKey.textContent = buttonSequence[currentButton];
    qteCircle.classList.add('visible');
    qteCircle.classList.add('warning');
    qteCircle.style.backgroundImage = 'url(resources/qte_' + type + '.png)';
    qteCircle.style.left = x;
    qteCircle.style.top = y;
    SOUND_QTE_APPEAR.currentTime = 0;
    SOUND_QTE_APPEAR.play();

    SOUND_QTE_TICKING.speed = duration / 1000 / 3;

    // Show warning circle and play sound
    setTimeout(function () {
      qteCircle.classList.remove('warning');
      slowMotion(duration);
      SOUND_QTE_TICKING.currentTime = 0;
      SOUND_QTE_TICKING.loop = true;
      SOUND_QTE_TICKING.play();

      qteTimerFill.setAttribute('stroke-dasharray', 100);
      timer = duration;
      intervalId = setInterval(() => {
        if (timer >= 10) {
          timer -= 10;
          let progress = (timer / duration) * 100;
          qteTimerFill.setAttribute(
            'stroke-dashoffset',
            100 - (progress / 100) * 100
          );
        } else {
          clearInterval(intervalId);
        }
      }, 10);

      // Start QTE
      if (isButtonMash) {
        var endTime = Date.now() + duration;
        timeoutId = setInterval(function () {
          if (QTEActive && Date.now() >= endTime) {
            qteCircle.classList.remove('visible');
            clearInterval(timeoutId);
            QTEActive = false;
            // success action here
          }
        }, 50);
      } else {
        timeoutId = setTimeout(function () {
          if (QTEActive) {
            qteCircle.classList.add('failed');
            SOUND_QTE_TICKING.loop = false;
            SOUND_QTE_TICKING.pause();
            SOUND_QTE_FAIL.currentTime = 0;
            SOUND_QTE_FAIL.play();
            setTimeout(function () {
              qteCircle.classList.remove('visible');
              qteCircle.classList.remove('failed');
            }, 1000);
            QTEActive = false;
            // failure action here
          }
        }, duration);
      }
    }, 1000);
  }
}

function checkButtonPress(event) {
  if (QTEActive && event.key === buttonSequence[currentButton].toLowerCase()) {
    currentButton++;
    if (currentButton === buttonSequence.length) {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      qteCircle.classList.add('success');
      SOUND_QTE_TICKING.loop = false;
      SOUND_QTE_TICKING.pause();
      setTimeout(function () {
        qteCircle.classList.remove('visible');
        qteCircle.classList.remove('success');
      }, 1000);
      QTEActive = false;
      // success action here
    } else {
      qteCircleKey.textContent = buttonSequence[currentButton];
      SOUND_QTE_APPEAR.currentTime = 0;
      SOUND_QTE_APPEAR.play();
      qteCircle.classList.add('active');
      setTimeout(function () {
        qteCircle.classList.remove('active');
      }, 100);
    }
  } else {
    if (qteCircle.classList.contains('visible')) {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      qteCircle.classList.add('failed');
      SOUND_QTE_TICKING.loop = false;
      SOUND_QTE_TICKING.pause();
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
  isCharacterSwitching = true;

  // Get before and after rotations
  var startRotation = {
    x: characters[currentCharacterIndex].camera.rotation.x,
    y: characters[currentCharacterIndex].camera.rotation.y,
    z: characters[currentCharacterIndex].camera.rotation.z,
  };
  currentCharacterIndex = index;
  var endRotation = {
    x: characters[currentCharacterIndex].camera.rotation.x,
    y: characters[currentCharacterIndex].camera.rotation.y,
    z: characters[currentCharacterIndex].camera.rotation.z,
  };
  camera.rotation.x = startRotation.x;
  camera.rotation.y = startRotation.y;
  camera.rotation.z = startRotation.z;
  console.log(startRotation, endRotation);

  // Trigger a slow motion effect
  slowMotion(2000);

  // Make the animation start a second after the slow motion.
  setTimeout(() => {
    // Set the start time of the animation
    flyTo(characterMeshes[index].position, endRotation, 1000, true);
    showCharacterInfo(characters[index]);
    setTimeout(() => {
      isCharacterSwitching = false;
    }, 1000);
  }, 1000);
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
    for (; t0 < t1;) {
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

function flyTo(position, rotation, duration, expo = false) {
  var startPosition = camera.position.clone();
  var startRotation = camera.rotation.clone();
  var endPosition = position;
  var endRotation = rotation;
  var startTime = performance.now();

  SOUND_CAMERA_WHOOSH.currentTime = 0;
  SOUND_CAMERA_WHOOSH.play();

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  function easeInOutExpo(number) {
    return number === 0
      ? 0
      : number === 1
        ? 1
        : number < 0.5
          ? Math.pow(2, 20 * number - 10) / 2
          : (2 - Math.pow(2, -20 * number + 10)) / 2;
  }

  function update(time) {
    var elapsed = (time - startTime) / duration;
    elapsed = Math.min(1, elapsed);
    var eased = expo ? easeInOutExpo(elapsed) : easeInOutQuad(elapsed);
    camera.position.x =
      startPosition.x + (endPosition.x - startPosition.x) * eased;
    camera.position.y =
      startPosition.y + (endPosition.y - startPosition.y) * eased;
    camera.position.z =
      startPosition.z + (endPosition.z - startPosition.z) * eased;
    camera.rotation.x =
      startRotation.x + (endRotation.x - startRotation.x) * eased;
    camera.rotation.y =
      startRotation.y + (endRotation.y - startRotation.y) * eased;
    camera.rotation.z =
      startRotation.z + (endRotation.z - startRotation.z) * eased;
    if (elapsed < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function onMouseDown() {
  if (isInGamePlaying) {
    viewport.requestPointerLock();
  }
}

function onMouseMove(event) {
  if (document.pointerLockElement === viewport) {
    // Update the mouse position
    characters[currentCharacterIndex].yaw -= event.movementX * sensitivity;
    characters[currentCharacterIndex].pitch -= event.movementY * sensitivity;
    characters[currentCharacterIndex].pitch = Math.min(
      Math.max(characters[currentCharacterIndex].pitch, -Math.PI / 2),
      Math.PI / 2
    );
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
  keyboardControlFlags.isShiftActive = event.shiftKey;
  keyboardControlFlags[event.key] = true;
}

// Create an onKeyUp function to update the player movement and camera rotation when a key is released
function onKeyUp(event) {
  keyboardControlFlags.isShiftActive = event.shiftKey;
  keyboardControlFlags[event.key] = false;
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
