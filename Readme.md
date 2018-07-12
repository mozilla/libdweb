# libdweb

[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

This repositiory hosts community effort of implementing [experimental APIs][webextension experiments] for Firefox WebExtensions with a goal of enabling dweb protocols in Firefox through an add-ons. The long term goal of this project is to eventually integrate this APIs into [WebExtensions][new apis] ecosystem.

## Participation

You can help this effort in following ways:

1.  Use this APIs to make something illustrating it's value to help build up the case for further investment.
2.  Get involved in driving this effort. Help with an implementation, maintenance, etc...
3.  Help build [API adapters][] to enable seamless integration with existing libraries.

## Status: In active development

| API                  | Status |
| -------------------- | ------ |
| [Protocol Handler][] | 🐥     |
| [mdns][]             | 🐣     |
| [File System][]      | 🐣     |
| [UDP Socket][]       | 🐣     |
| [TCP Socket][]       | 🐣     |

- 🥚 : In design phase
- 🐣 : Work in progress
- 🐥 : Try it out
- 🐓 : Usable

## API overview

**Note:** You can try all the examples after you've cloned the repo and got the toolchain setup by running `npm install`. You will also need [Firefox Nightly][] to run the demos.

### Protocol API

Protocol API allows you to provide custom protocol implementation to a firefox such that firefox. This is different from existing [WebExtensions protocol handler API][webextensions protocol_handlers] in that it does not register a website for handling corresponding URLs but rather allows WebExtension to implement a handler instead.

#### Example

Following example implements a simple `dweb://` protocol. When firefox is navigated to say `dweb://hello/world` it will invoke registered handler and pass it a `request` object containing request URL as `request.url` string property. Handler is expected to return a repsonse with a `content` that is [async iterator][] of [`ArrayBuffer`][]s. In our example we use `repsond` [async generator][] function to respond with some HTML markup.

```js
browser.protocol.registerProtocol("dweb", request => {
  return {
    contentType: "text/html",
    content: respond(request.url)
  }
})

async function* respond(text) {
  const encoder = new TextEncoder("utf-8")
  yield encoder.encode("<h1>Hi there!</h1>\n").buffer
  yield encoder.encode(
    `<p>You've succesfully loaded <strong>${request.url}</strong><p>`
  ).buffer
}
```

Given that `response.content` is [async iterator][] it is also possible to stream response content as next example illustrates.

```js
browser.protocol.registerProtocol("dweb", request => {
  switch (request.url) {
    case "dweb://stream/": {
      return {
        contentType: "text/html",
        content: streamRespond(request)
      }
    }
    default: {
      return {
        contentType: "text/html",
        content: respond(request.url)
      }
    }
  }
})

async function* streamRespond(request) {
  const encoder = new TextEncoder("utf-8")
  yield encoder.encode("<h1>Say Hi to endless stream!</h1>\n").buffer
  let n = 0
  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    yield encoder.encode(`<p>Chunk #${++n}<p>`).buffer
  }
}
```

You can see a dom of this API in [Firefox Nightly][] by running following command

```
npm run demo:protocol
```

![protocol demo](./demo/protocol/protocol.gif)

### mDNS API

Following command will launch [Firefox Nightly][] with mDNS API demo addon

```
npm run demo:mdns
```

![mDNS button](./demo/mdns/mDNS.gif)

### FileSystem API

Following command will launch [Firefox Nightly][] with FileSystem API demo addon

```
npm run demo:fs
```

![FileSystem](./demo/fs/fs.gif)

### UDPSocket API

Following command will launch [Firefox Nightly][] with UDPSocket API demo addon

```
npm run demo:dgram
```

### TCPSocket API

Following command will launch [Firefox Nightly][] with TCPSocket API demo addon

```
npm run demo:tcp
```

### All APIs

Following command will launch [Firefox Nightly][] with a demo containing all the above

```
npm run demo
```

[travis.icon]: https://travis-ci.org/mozilla/libdweb.svg?branch=master
[travis.url]: https://travis-ci.org/mozilla/libdweb
[version.icon]: https://img.shields.io/npm/v/libdweb.svg
[downloads.icon]: https://img.shields.io/npm/dm/libdweb.svg
[package.url]: https://npmjs.org/package/libdweb
[downloads.image]: https://img.shields.io/npm/dm/libdweb.svg
[downloads.url]: https://npmjs.org/package/libdweb
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
[webextension experiments]: https://webextensions-experiments.readthedocs.io/en/latest/index.html
[new apis]: https://wiki.mozilla.org/WebExtensions/NewAPIs
[protocol handler]: https://github.com/mozilla/libdweb/issues/2
[udp socket]: https://github.com/mozilla/libdweb/issues/4
[tcp socket]: https://github.com/mozilla/libdweb/issues/5
[µtp socket]: https://github.com/mozilla/libdweb/issues/6
[mdns]: https://github.com/mozilla/libdweb/issues/7
[file system]: https://github.com/mozilla/libdweb/issues/8
[web-ext]: https://www.npmjs.com/package/web-ext
[firefox nightly]: https://blog.nightly.mozilla.org/
[api-adapters]: https://github.com/libdweb
[webextensions protocol_handlers]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/protocol_handlers
[async iterator]: https://github.com/tc39/proposal-async-iteration#async-iterators-and-async-iterables
[`arraybuffer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[async generator]: https://github.com/tc39/proposal-async-iteration#async-generator-functions
