;(async () => {
  let services = await browser.mdns.startDiscovery("_http._tcp")
  console.log("(demo) services...", services)
})()
