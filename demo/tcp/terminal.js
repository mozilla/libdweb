const input = document.querySelector("input")
const output = document.querySelector("output")
document.onload = () => input.focus()

const keydown = async function*() {
  let send = event => void event
  const event = () => new Promise(resolve => (send = resolve))
  document.onkeydown = event => send(event)

  while (true) {
    const key = await event()

    yield key
  }
}

const readWhiteSpace = (input, offset, toknes) => {
  while (offset < input.length) {
    const char = input.charAt(offset)
    if (char === " ") {
      offset++
    } else {
      break
    }
  }
  return offset
}

const readToken = (input, offset, tokens) => {
  let position = offset
  while (position < input.length) {
    const char = input.charAt(position)
    if (char === " ") {
      break
    } else {
      position++
    }
  }
  tokens.push(input.slice(offset, position))
  return position
}

const readString = (quote, input, start, tokens) => {
  let end = start + 1
  let token = input.charAt(start)
  while (end < input.length) {
    const char = input.charAt(end)
    switch (char) {
      case quote: {
        end++
        token += char
        tokens.push(token)
        return end
      }
      case `\\`: {
        token += char
        end++
        token += input.charAt(end)
        end++
        break
      }
      default: {
        token += char
        end++
      }
    }
  }
  throw RangeError(`String was not quoted properly: ${input.slice(start, end)}`)
}

const parseCommand = input => {
  const source = input.trim()
  const tokens = []
  let offset = 0
  const size = source.length
  while (offset < size) {
    const char = input.charAt(offset)
    switch (char) {
      case `'`:
      case `"`: {
        offset = readString(char, input, offset, tokens)
        break
      }
      case ` `: {
        offset = readWhiteSpace(input, offset, tokens)
        break
      }
      default: {
        offset = readToken(input, offset, tokens)
      }
    }
  }

  const [command, ...args] = tokens
  const params = Object.create(null)
  let index = 0
  while (index < args.length) {
    const arg = args[index++]
    if (arg.startsWith("--")) {
      const name = arg.substr(2)
      const value = args[index]
      if (index == args.length || value.startsWith("--")) {
        params[name] = true
      } else {
        try {
          params[name] = JSON.parse(value)
        } catch (_) {
          params[name] = value
        }
      }
    }
  }
  return [command, params]
}

const serializeCommand = (command, params) => {
  let tokens = [command]
  for (const [key, value] of Object.entries(params)) {
    tokens.push(`--${key}`)
    if (value !== true) {
      tokens.push(String(value))
    }
  }
  return tokens.join(" ")
}

const execute = async state => {
  const { value } = input
  const inn = document.createElement("code")
  inn.classList.add("inn")
  inn.textContent = value
  const out = document.createElement("code")
  out.classList.add("out")
  out.textContent = ""

  output.appendChild(inn)
  output.appendChild(out)
  input.value = ""

  const toSocket = socket => ({
    id: `TCPSocket@${socket.id}`
  })
  const fromSocket = socket => socket.id.replace(`TCPSocket@`, "")

  try {
    const [command, params] = parseCommand(value)
    switch (command) {
      case "clear": {
        output.innerHTML = ""
        break
      }
      case "listen": {
        const socket = await browser.TCPSocket.listen(params)
        const ref = fromSocket(socket)
        out.textContent = `socket: ${ref} ${JSON.stringify(socket, null, 2)}`
        break
      }
      case "close": {
        await browser.TCPSocket.close(toSocket(params))
        out.textContent = `closed`
        break
      }
      case "send": {
        const { host, port, size, encode } = params

        const encoder = new TextEncoder()
        const { buffer } = encoder.encode(params.encode)
        await browser.TCPSocket.send(toSocket(params), host, port, buffer, size)
        out.textContent = `sent`
        break
      }
      case "setMulticastLoopback": {
        const { flag } = params
        await browser.TCPSocket.setMulticastLoopback(toSocket(params), flag)

        out.textContent = `setMulticastLoopback: ${flag}`
        break
      }
      case "setMulticastInterface": {
        const { id } = params
        const multicastInterface = params["interface"]

        await browser.TCPSocket.setMulticastInterface(
          toSocket(params),
          multicastInterface
        )

        out.textContent = `setMulticastInterface: ${multicastInterface}`

        break
      }
      case "addMembership": {
        const { address } = params
        const multicastInterface = params["interface"]

        await browser.TCPSocket.addMembership(
          toSocket(params),
          address,
          multicastInterface
        )

        out.textContent = `addMembership: ${address} ${multicastInterface}`
        break
      }
      case "dropMembership": {
        const { id, address } = params
        const multicastInterface = params["interface"]

        await browser.TCPSocket.dropMembership(
          toSocket(params),
          address,
          multicastInterface
        )

        out.textContent = `dropMembership: ${address} ${multicastInterface}`
        break
      }
      case "messages": {
        const socket = toSocket(params)
        const decoder = new TextDecoder()
        const loop = async function() {
          out.classList.add("pending")
          const message = out.ownerDocument.createElement("code")
          message.classList.add("chunk")

          const intro = message.cloneNode(true)
          intro.textContent = "await messages:"
          out.appendChild(intro)
          out.appendChild(out.ownerDocument.createElement("br"))
          for await (const { data, from } of browser.TCPSocket.messages(
            socket
          )) {
            const view = message.cloneNode(true)
            const payload = decoder.decode(data)
            view.textContent = `${JSON.stringify(from)} -> ${JSON.stringify(
              payload
            )}`
            out.appendChild(view)
            out.appendChild(out.ownerDocument.createElement("br"))
          }
          out.classList.remove("pending")
        }
        loop()

        break
      }
      default: {
        out.textContent = `command not found: ${command}`
        break
      }
    }
  } catch (error) {
    out.textContent = error.toString()
    out.classList.add("error")
  }
}

class Model {
  constructor() {
    this.history = []
    this.offset = 0
    this.sockets = Object.create(null)
    this.id = 0
    this.volume = null
  }
  resolve(url) {
    if (this.volume) {
      return new URL(url, this.volume.url).toString()
    } else {
      return url
    }
  }
  file(fd) {
    return this.files[fd]
  }
  open(file) {
    const fd = `${++this.id}`
    this.files[fd] = file
    return fd
  }

  close(fd) {
    delete this.files[fd]
  }
  selectPrevious() {
    this.offset = Math.min(this.offset + 1, this.history.length)
    return this.selected()
  }
  selectNext() {
    this.offset = Math.max(this.offset - 1, 0)
    return this.selected()
  }
  selected() {
    return this.history[this.history.length - this.offset]
  }
  addEntry(input) {
    this.history.push(input)
    this.offset = 0
    return this
  }
}

const main = async () => {
  const state = new Model()
  for await (const event of keydown()) {
    switch (event.key) {
      case "Enter": {
        event.preventDefault()
        if (event.shiftKey) {
          state.addEntry(input.value)
          input.value = ""
        } else {
          execute(state.addEntry(input.value))
        }
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        const entry = state.selectPrevious()
        if (entry) {
          input.value = entry
          input.setSelectionRange(entry.length, entry.length)
        }
        break
      }
      case "ArrowDown": {
        event.preventDefault()
        const entry = state.selectNext()
        if (entry) {
          input.value = entry
          input.setSelectionRange(entry.length, entry.length)
        }
        break
      }
      default: {
      }
    }
  }
}

main()
