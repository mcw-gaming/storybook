!(function (exports) {
  'use strict';

  var episodesMenu = document.getElementById('episodes-menu');
  var backButton = document.getElementById('episodes-menu-back-button');

  backButton.onclick = () => {
    openInGameUi('main-menu');
    flyTo({ x: 0, y: 10, z: 10 }, { x: 0, y: 0, z: 0 }, 1000);
  };
})(window);
