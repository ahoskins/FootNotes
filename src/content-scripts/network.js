/*
first two are fire and forget, last returns a promise
*/

// get id from database
function deleteAnnotationById(id) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  }
  xhr.open("DELETE", "https://youtube-annotate-backend.herokuapp.com/api/remove/" + id, true);
  xhr.send(null);
}

// {time: Number, content: String} (apply for each localstorage array)
function shareAnnotation(annotation, username) {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  }
  xhr.open("POST", "https://youtube-annotate-backend.herokuapp.com/api/create/", true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.send('time=' + annotation.time + '&target=' + username + '&url=' + window.location.href + '&content=' + annotation.content);
}

function getMatchingAnnotations(username) {
  return new Promise(function(resolve, reject) {
    // GET NEW FROM SERVER THEN DELETE & SET STATE BASED ON CURRENT CONTENTS OF LOCALSTORAGE
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(Error(xhr.statusText));
      }
    }
    xhr.open("GET", "https://youtube-annotate-backend.herokuapp.com/api/match/" + username, true);
    xhr.send(null);
  })
}

export {deleteAnnotationById, shareAnnotation, getMatchingAnnotations};
