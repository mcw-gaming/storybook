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

document.addEventListener('dblclick', () => {
  startQTE('attack', '50%', '75%', { duration: parseInt(Math.random() * 10000) });
});
