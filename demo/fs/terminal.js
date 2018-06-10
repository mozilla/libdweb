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

  try {
    const [command, params] = parseCommand(value)
    switch (command) {
      case "clear": {
        output.innerHTML = ""
        break
      }
      case "mount": {
        const volume = await browser.FileSystem.mount(params)
        state.mount(volume)
        out.textContent = `mounted: ${JSON.stringify(volume, null, 2)}`
        break
      }
      case "open": {
        const url = state.resolve(params.url)
        delete params.url
        const file = await browser.FileSystem.open(url, params)
        out.textContent = `opened: ${state.open(file)}`
        break
      }
      case "flush": {
        const file = state.file(params.file)
        await browser.File.flush(file)
        out.textContent = `flushed: ${params.file}`
        break
      }
      case "close": {
        const file = state.file(params.file)
        await browser.File.close(file)
        state.close(params.file)
        out.textContent = `closed: ${params.file}`
        break
      }
      case "read": {
        const file = state.file(params.file)
        const decode = params.decode

        delete params.file
        delete params.decode

        const buffer = await browser.File.read(file, params)
        if (decode) {
          const decoder = new TextDecoder()
          const content = decoder.decode(buffer)
          out.textContent = JSON.stringify(content)
        } else {
          out.textContent = `<ArrayBuffer ${buffer.byteLength}>`
        }
        break
      }
      case "write": {
        console.log(params)
        const file = state.file(params.file)
        delete params.file
        const encoder = new TextEncoder()
        const { buffer } = encoder.encode(params.encode)
        delete params.encode
        const offset = await browser.File.write(file, buffer, params)
        out.textContent = `wrote: ${offset}`
        break
      }
      case "stat": {
        const file = state.file(params.file)
        const stat = await browser.File.stat(file)
        out.textContent = JSON.stringify(stat, null, 2)
        break
      }
      case "getPosition": {
        const file = state.file(params.file)
        const position = await browser.File.getPosition(file)
        out.textContent = `got position: ${position}`
        break
      }
      case "setDates": {
        const file = state.file(params.file)
        delete params.file
        await browser.File.setDates(file, params)
        out.textContent = `dates set`
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
        console.log(event)
      }
    }
  }
}

main()
