function onCreated(tab) {
  console.log(`Created new tab: ${tab.id}`)
}

function onError(error) {
  console.log(`Error: ${error}`)
}

function openChat() {
  var creating = browser.tabs.create({
    url: "/chat.html"
  })
  creating.then(onCreated, onError)
}

browser.browserAction.onClicked.addListener(function() {
  openChat()
})

openChat()
