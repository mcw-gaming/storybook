!(function (exports) {
  'use strict';

  var exitMenu = document.getElementById('exit-game');
  var cancelButton = document.getElementById('exit-game-cancel-button');
  var confirmButton = document.getElementById('exit-game-confirm-button');

  cancelButton.onclick = () => {
    flyTo({ x: 0, y: 10, z: 10 }, { x: 0, y: 0, z: 0 }, 1000);
    exitMenu.classList.remove('visible');
  };

  confirmButton.onclick = () => {
    window.close();
  };
})(window);
