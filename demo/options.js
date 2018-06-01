const onChoose = async () => {
  const volume = await browser.FileSystem.mount({
    title: "Choose the default directory where your projects will be saved.",
    read: true,
    write: false,
    watch: false
  })

  volumeURLField.value = volume.url
  volumeField.value = volume.url

  console.log("mounted URL", volume, volumeURLField, volumeField)
}

const chooseButton = document.querySelector("#choose")
const volumeURLField = document.querySelector("#volume-url")
const volumeField = document.querySelector("#volume")

chooseButton.onclick = onChoose
