window.onload = function() {
  //
  document.addEventListener(
    "keydown",
    function(e) {
      if (e.keyCode == 13) {
        toggleFullScreen()
      }
    },
    false
  )

  // 💀💀💀💀💀💀💀💀
  function toggleFullScreen() {
    // Moz prefixed
    if (document.documentElement.mozRequestFullScreen) {
      if (!document.mozFullScreenElement) {
        document.documentElement.mozRequestFullScreen()
      } else {
        document.mozCancelFullScreen()
      }
    }

    // Moz not prefixed
    if (document.documentElement.requestFullscreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
  }
  document.documentElement.ondblclick = toggleFullScreen

  // Initialize deck
  if (window.MVSD) {
    var sections = Array.from(document.querySelectorAll("section"))
    var deck = new MVSD(sections)
  }

  var states = {
    previous: null,
    current: null
  }

  function onVisibilityChange(e) {
    if (e.visible == 1 && states.current != e.target) {
      states.previous = states.current
      states.current = e.target
      if (states.previous) {
        // First load has no previous state
        toggleIframe(states.previous, 0)
      }
      toggleIframe(states.current, 1)
    }
    // otherwise no change in fully visible card, so do nothing
  }

  function toggleIframe(el, visible) {
    const iframe = el.querySelector("iframe")
    if (!iframe) {
      return
    }
    // enable
    if (visible == 1) {
      var dataSrc = iframe.dataset.src
      if (dataSrc) {
        iframe.src = dataSrc
      }
    }
    // disable
    else {
      iframe.src = ""
    }
  }

  let iob = new IntersectionObserver(
    infos => {
      infos
        .filter(info => [0, 1].includes(info.intersectionRatio))
        .map(info => {
          return { target: info.target, visible: info.intersectionRatio }
        })
        .forEach(onVisibilityChange)
    },
    { threshold: [0, 1] }
  )

  const qsa = "section"
  const els = document.querySelectorAll(qsa)
  Array.prototype.slice.call(els).forEach(el => {
    iob.observe(el)
  })

  /*
  var hammertime = new Hammer(document.documentElement);
  hammertime.on('swipe', function(ev) {
    console.log('swipe', ev);
    var hash = parseInt(window.location.hash.substr(1), 10);
    console.log('hash', hash)
  });
  */
}

function onDCL() {
  // initialize websocket connection
  var server = window.location.hostname,
    port = 8009,
    socketURL = "wss://" + server + ":" + port,
    socket = new WebSocket(socketURL)

  socket.onopen = function() {
    console.log("socket opened")

    // ensures binary sends work correctly
    socket.binaryType = "arraybuffer"

    socket.onmessage = function(msg) {
      var obj = JSON.parse(msg.data)
      console.log("ws message:", obj)
      if (obj.clients != undefined) {
        updateViewerData(obj)
      }
    }
  }
}
//window.addEventListener('DOMContentLoaded', onDCL);

function updateViewerData(data) {
  console.log("updating data")
  var bindings = {
    connected: { selector: "#countConnected", data: 0 },
    desktop: { selector: "#countDesktop", data: 0 },
    mobile: { selector: "#countMobile", data: 0 },
    android: { selector: "#countAndroid", data: 0 },
    ios: { selector: "#countIOS", data: 0 },
    other: { selector: "#countOther", data: 0 }
  }

  bindings.connected.data = data.clients

  var stats = getUAStats(data.userAgents)

  Object.keys(stats).forEach(function(key) {
    bindings[key].data = stats[key]
  })

  Object.keys(bindings).forEach(function(key) {
    var binding = bindings[key]
    document.querySelector(binding.selector).innerText = binding.data
  })
}

function getUAStats(data) {
  var stats = {
    desktop: 0,
    mobile: 0,
    android: 0,
    ios: 0,
    other: 0
  }

  Object.keys(data).forEach(function(ua) {
    // Mobile vs desktop
    if (ua.indexOf("Mobi") != -1) {
      stats.mobile += data[ua]
    } else {
      stats.desktop += data[ua]
    }
    // Which mobile platform
    if (ua.indexOf("Android") != -1) {
      stats.android += data[ua]
    }
    // iOS
    else if (ua.indexOf("Mobile Safari") != -1) {
      stats.ios += data[ua]
    }
    // Other mobile
    else {
      stats.other += data[ua]
    }
  })

  return stats
}
