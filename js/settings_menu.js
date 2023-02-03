!(function (exports) {
  'use strict';

  var settingsMenu = document.getElementById('settings-menu');
  var backButton = document.getElementById('settings-menu-back-button');

  backButton.onclick = () => {
    openInGameUi('main-menu');
    flyTo({ x: 0, y: 10, z: 10 }, { x: 0, y: 0, z: 0 }, 1000);
  };
})(window);
