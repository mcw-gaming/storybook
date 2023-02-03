!(function (exports) {
  "use strict";

  var mainMenu = document.getElementById("main-menu");
  var playButton = document.getElementById("main-menu-play-button");
  var settingsButton = document.getElementById("main-menu-settings-button");
  var exitButton = document.getElementById("main-menu-exit-button");

  openInGameUi("main-menu");

  playButton.onclick = () => {
    openInGameUi("episodes-menu");
    flyTo({ x: 20, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1000);
  };

  settingsButton.onclick = () => {
    flyTo({ x: 200, y: 20, z: 10 }, { x: THREE.MathUtils.degToRad(-25), y: THREE.MathUtils.degToRad(-25), z: 0 }, 1000);
    openInGameUi("settings-menu");
  };

  exitButton.onclick = () => {
    openInGameUi("exit-game", true);
    flyTo({ x: 0, y: 20, z: 10 }, { x: 0, y: 0, z: 0 }, 1000);
  };
})(window);
