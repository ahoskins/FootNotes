/*
given a string, generate a determinate aesthetically pleasing pastel color
*/
function makePastelColor(username) {
  let hash = _hashCode(username.slice(0, username.indexOf('@')));

  // slice the hash into color components
  let red = hash.toString().slice(0, 3) % 255;
  let green = hash.toString().slice(3, 6) % 255;
  let blue = hash.toString().slice(6, 9) % 255;

  // mix with any color (right now mixing with light grey)
  let redMix = Math.floor((red + 220) / 2);
  let greenMix = Math.floor((green + 220) / 2);
  let blueMix = Math.floor((blue + 220) / 2);

  return redMix.toString(16) + greenMix.toString(16) + blueMix.toString(16);
}

function _hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
     hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export {makePastelColor};
