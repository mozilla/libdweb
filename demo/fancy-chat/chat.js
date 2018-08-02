async function main() {
  var encoder = new TextEncoder()
  var decoder = new TextDecoder()
  var channelContent = document.querySelector(".channel-content")
  var textToSend = document.querySelector("[name=msg]")
  var nicknameElement = document.querySelector("[name=nickname]")
  var sendChatButton = document.querySelector("#send")
  var multicastGroup = "239.1.2.3"
  var peers = new Map()
  var channelMessages = { general: [] }
  var activeChannel = "general"

  const socket = await browser.UDPSocket.create({
    host: "0.0.0.0",
    port: 41235
  })

  var addPeer = peer => {
    var key = `${peer.nickname}@${peer.host}`
    peers.set(key, peer)
  }

  var updatePeersColumn = () => {
    var peersEl = document.querySelector(".peers")
    peersEl.innerHTML = ""
    peers.forEach(peer => {
      console.log(peer)
      let li = document.createElement("li")
      let span = document.createElement("span")
      span.innerText = peer.nickname
      li.appendChild(span)
      peersEl.appendChild(li)
    })
  }

  var switchActiveChannel = channel => {
    if (typeof channelMessages[channel] == "undefined") {
      channelMessages[channel] = []
    }

    console.log(channelMessages)

    activeChannel = channel
    channelContent.innerHTML = ""
    channelMessages[channel].forEach(msg => {
      appendChatMessage(msg)
    })

    updateChannelsColumn()
  }

  var updateChannelsColumn = () => {
    var channelsEl = document.querySelector(".channels")
    channelsEl.innerHTML = ""
    var channels = Object.keys(channelMessages)
    channels.forEach(channel => {
      console.log(channel)
      let li = document.createElement("li")
      let span = document.createElement("span")
      span.innerText = channel
      span.addEventListener("click", ev => {
        switchActiveChannel(channel)
      })
      if (activeChannel == channel) {
        li.className = "active-channel"
      }
      li.appendChild(span)
      channelsEl.appendChild(li)
    })
  }

  var processChatMessage = (from, data) => {
    if (typeof channelMessages[data.channel] == "undefined") {
      channelMessages[data.channel] = []
    }
    channelMessages[data.channel].push(data)

    console.log(channelMessages)

    if (activeChannel == data.channel) {
      appendChatMessage(data)
    }
    updateChannelsColumn()

    var peer = {
      host: from.host,
      nickname: data.nickname
    }

    if (!peers.has(`${peer.nickname}@${peer.host}`)) {
      addPeer(peer)
      updatePeersColumn()
    }
  }

  var appendChatMessage = data => {
    var el = document.createDocumentFragment()
    var p = document.createElement("p")
    p.innerText = `${data.nickname}: ${data.content}`
    p.style.color = colorForName(data.nickname)
    console.log("payload", data)
    console.log("color", colorForName(data.nickname))
    el.appendChild(p)
    channelContent.appendChild(el)
    channelContent.scrollTop = channelContent.scrollHeight
  }

  var colorForName = name => {
    var colours = ["#E37B40", "#46B29D", "#DE5B49", "#324D5C", "F0C94D"]
    var sum = 0
    for (var i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i)
    }
    return colours[sum % colours.length]
  }

  var announcePeer = async ev => {
    var nickname = nicknameElement.value || "nameless being"
    localStorage.setItem("nickname", nickname)
    await multiCastData({ kind: "peer", nickname: nickname })
  }

  var sendChat = async ev => {
    var content = textToSend.value || "no content"
    var nickname = nicknameElement.value || "nameless being"
    var kind = "chat"
    var payload = {
      kind,
      nickname,
      content,
      channel: activeChannel
    }
    textToSend.value = ""
    localStorage.setItem("nickname", nickname)
    await multiCastData(payload)
  }

  var multiCastData = async data => {
    var payload = JSON.stringify(data)
    const encoder = new TextEncoder()

    // multicasting
    await browser.UDPSocket.addMembership(socket, multicastGroup)
    const multi_message = encoder.encode(payload).buffer
    await browser.UDPSocket.send(socket, multicastGroup, 41235, multi_message)
  }

  var serve = async () => {
    console.log("adding to multicast group:", multicastGroup)
    browser.UDPSocket.setMulticastInterface(socket, multicastGroup)
    browser.UDPSocket.addMembership(socket, multicastGroup)
    console.log(`udp listening ${socket.address.host}:${socket.address.port}`)

    const decoder = new TextDecoder()
    for await (const { from, data } of browser.UDPSocket.messages(socket)) {
      const payload = JSON.parse(decoder.decode(data))
      console.log(`udp from ${from.host}:${from.port}`, payload)
      switch (payload.kind) {
        case "chat":
          processChatMessage(from, payload)
          break
        case "peer":
          var peer = {
            host: from.host,
            nickname: payload.nickname
          }

          if (!peers.has(`${peer.nickname}@${peer.host}`)) {
            addPeer(peer)
            updatePeersColumn()
          }
          break
      }
    }
  }

  sendChatButton.addEventListener("click", sendChat)
  textToSend.addEventListener("keyup", ev => {
    if (ev.keyCode === 13) {
      sendChatButton.click()
    }
  })
  nicknameElement.addEventListener("keyup", ev => {
    if (ev.keyCode === 13) {
      announcePeer()
    }
  })

  document.getElementById("set-nickname").addEventListener("click", ev => {
    announcePeer()
  })
  document.getElementById("new-channel").addEventListener("click", ev => {
    var channel = prompt("channel name")
    if (channel) {
      var payload = {
        kind: "chat",
        channel: channel,
        nickname: nicknameElement.value,
        content: `${nicknameElement.value} joins ${channel}`
      }

      multiCastData(payload)
      switchActiveChannel(channel)
    }
  })

  serve()

  nicknameElement.value = localStorage.getItem("nickname") || ""
  if (nicknameElement.value !== "") {
    announcePeer()
  }
}

main()
