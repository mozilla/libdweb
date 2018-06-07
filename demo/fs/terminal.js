const input = document.querySelector(".input")

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

const parseCommand = input => {
  const [command, ...args] = input.trim().split(/\s+/)
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
        params[name] = value
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
  const [command, params] = parseCommand(input.value)
  const log = document.createElement("code")
  log.textContent = serializeCommand(command, params)
  const output = document.createElement("output")
  output.textContent = ""

  input.parentElement.insertBefore(log, input)
  input.parentElement.insertBefore(output, input)
  input.value = ""

  try {
    switch (command) {
      case "mount": {
        const volume = await browser.FileSystem.mount(params)
        state.mount(volume)
        output.textContent = JSON.stringify(volume, null, 2)
        break
      }
      case "open": {
        const url = state.resolve(params.url)
        delete params.url
        const file = await browser.FileSystem.open(url, params)
        output.textContent = `opened: ${state.open(file)}`
        break
      }
      case "flush": {
        const file = state.file(params.file)
        await browser.FileSystem.flush(file)
        output.textContent = `flushed: ${params.file}`
        break
      }
      case "close": {
        const file = state.file(params.file)
        await browser.FileSystem.close(file)
        state.close(params.file)
        output.textContent = `closed: ${params.file}`
        break
      }
      case "read": {
        const file = state.file(params.file)
        const decode = params.decode

        delete params.file
        delete params.decode

        const buffer = await browser.FileSystem.read(file, params)
        if (decode) {
          const decoder = new TextDecoder()
          const content = decoder.decode(buffer)
          console.log(content)
          output.textContent = content
        } else {
          output.textContent = `<ArrayBuffer ${buffer.byteLength}>`
        }
        break
      }
      case "write": {
        break
      }
      default: {
        output.textContent = `command not found: ${command}`
        break
      }
    }
  } catch (error) {
    output.textContent = error.toString()
  }
}

class Model {
  constructor() {
    this.history = []
    this.offset = 0
    this.files = Object.create(null)
    this.id = 0
    this.volume = null
  }
  mount(volume) {
    this.volume = volume
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
        execute(state.addEntry(input.value))
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
        console.log(event)
      }
    }
  }
}

main()
