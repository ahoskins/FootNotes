function injectYoutubePoller() {
  const injectedCode = '(' + function() {
      youtubeFootNotesInterval = setInterval(function() {
      const current = document.getElementById('movie_player').getCurrentTime();
      const total = document.getElementById('movie_player').getDuration();
      const customEvent = new CustomEvent('youtube', {'detail': {'current': current, 'total': total, 'location': window.location.href}});
      document.dispatchEvent(customEvent);
    }, 1000);

  } + ')();';

  const script = document.createElement('script');
  script.textContent = injectedCode;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

function removeInjectedYoutubePoller() {
  const injectedCode = '(function() {window.clearInterval(youtubeFootNotesInterval);})();';

  const script = document.createElement('script');
  script.textContent = injectedCode;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

function injectSeekToTime(time) {
  const injectedCode = '(' + function(time) {
    document.getElementById('movie_player').seekTo(JSON.stringify(time), true);
  } + ')(' + JSON.stringify(time) + ');';

  const script = document.createElement('script');
  script.textContent = injectedCode;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

export {injectYoutubePoller, injectSeekToTime, removeInjectedYoutubePoller};
