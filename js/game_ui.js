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

  exports.openInGameUi = openInGameUi;
})(window);
