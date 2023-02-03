!(function (exports) {
  'use strict';

  function openInGameUi(id, isDialog = false) {
    if (!isDialog) {
      var visible = document.querySelector('.game-ui.visible');
      if (visible) {
        visible.classList.remove('visible');
      }
    }

    var specified = document.getElementById(id);
    if (specified) {
      specified.classList.add('visible');
    }
  }

  var buttons = document.querySelectorAll('.game-ui button, .game-ui .button');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {});
  });

  exports.openInGameUi = openInGameUi;
})(window);
