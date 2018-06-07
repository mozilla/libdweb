let fs = null

const onChoose = async () => {
  const volume = await browser.FileSystem.mount({
    read: readable.checked,
    write: writable.checked,
    watch: watchable.checked
  })
  onMount(volume)
}

const onMount = drive => {
  console.log("mounted", drive)
  fs = drive
  volume.value = fs.url
  readable.checked = fs.readable
  writable.checked = fs.writable
  watchable.checked = fs.watchable
}

const onChange = async event => {
  if (fs) {
    const options = {
      url: fs.url,
      read: readable.checked,
      write: writable.checked,
      watch: watchable.checked
    }

    console.log(`request permission ${JSON.stringify(options)}`)
    onMount(await browser.FileSystem.mount(options))
  }
}

const chooseButton = document.querySelector("#choose")
const volume = document.querySelector("#volume")
const readable = document.querySelector("#readable")
const writable = document.querySelector("#writable")
const watchable = document.querySelector("#watchable")

chooseButton.onclick = onChoose
readable.onchange = onChange
writable.onchange = onChange
watchable.onchange = onChange
