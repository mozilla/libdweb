const main = async () => {
  const services = await browser.mdns.startDiscovery("_http._tcp")
  document.querySelector(".loader").style.display = "none"
  document.querySelector(".services").textContent = JSON.stringify(
    services,
    null,
    2
  )
}
main()
