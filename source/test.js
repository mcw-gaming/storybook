document.addEventListener('keydown', (evt) => {
  switch (evt.key) {
    case '0':
      switchCharacter(0);
      break;

    case '1':
      switchCharacter(1);
      break;

    case '2':
      switchCharacter(2);
      break;
  }
});

document.getElementById('qte-button').addEventListener('click', startQTE);
