async function main() {
  var encoder = new TextEncoder()
  var decoder = new TextDecoder()
  var chatMessages = document.querySelector(".chat-messages")
  var textToSend = document.querySelector("[name=msg]")
  var nicknameElement = document.querySelector("[name=nickname]")
  var sendChatButton = document.querySelector("#send")
  var multicastGroup = "239.1.2.3"

  const socket = await browser.UDPSocket.create({
    host: "0.0.0.0",
    port: 41235
  })

  var appendChatMessage = payload => {
    var el = document.createDocumentFragment()
    var p = document.createElement("p")
    var data = JSON.parse(payload)
    p.innerText = `${data.nickname}: ${data.content}`
    p.style.color = colorForName(data.nickname)
    console.log("payload", data)
    console.log("color", colorForName(data.nickname))
    el.appendChild(p)
    chatMessages.appendChild(el)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  var colorForName = name => {
    var colours = ["#E37B40", "#46B29D", "#DE5B49", "#324D5C", "F0C94D"]
    var sum = 0
    for (var i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i)
    }
    return colours[sum % colours.length]
  }

  var sendChat = async ev => {
    var content = textToSend.value || "no content"
    var nickname = nicknameElement.value || "nameless being"
    var kind = "chat"
    // builing a flexible payload below so that I can enhance this demo
    // with messages beyond chat later...
    var payload = JSON.stringify({
      kind,
      nickname,
      content
    })
    // const client = await browser.UDPSocket.create({
    //   host: "0.0.0.0",
    //   port: 41235
    // })
    textToSend.value = ""
    const encoder = new TextEncoder()

    // multicasting
    await browser.UDPSocket.addMembership(socket, multicastGroup)
    const multi_message = encoder.encode(payload).buffer
    await browser.UDPSocket.send(socket, multicastGroup, 41235, multi_message)
  }

  var serve = async () => {
    // const server = await browser.UDPSocket.create({
    //   host: '0.0.0.0',
    //   port: 41235
    // })
    console.log("adding to multicast group:", multicastGroup)
    browser.UDPSocket.setMulticastInterface(socket, multicastGroup)
    browser.UDPSocket.addMembership(socket, multicastGroup)
    console.log(`udp listening ${socket.address.host}:${socket.address.port}`)

    const decoder = new TextDecoder()
    for await (const { from, data } of browser.UDPSocket.messages(socket)) {
      const payload = decoder.decode(data)
      console.log(`udp server got: ${payload} from ${from.host}:${from.port}`)
      appendChatMessage(payload)
    }
  }

  sendChatButton.addEventListener("click", sendChat)
  textToSend.addEventListener("keyup", ev => {
    if (ev.keyCode === 13) {
      sendChatButton.click()
    }
  })

  serve()
}

main()
