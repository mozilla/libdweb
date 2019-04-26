var bonjour = require("bonjour")()

// advertise an HTTP server on port 3000
bonjour.publish({ name: "My Web Server", type: "http", port: 4000 })

// browse for all http services
bonjour.find({ type: "http" }, function(service) {
  service //?

  console.log("Found an HTTP server:", service)
})
