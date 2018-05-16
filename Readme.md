# libdweb

[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

This repositiory hosts community effort of implementing [experimental APIs][webextension experiments] for Firefox WebExtensions with a goal of enabling dweb protocols in Firefox through an add-ons. The long term goal of this project is to eventually integrate this APIs into [WebExtensions][new APIs] ecosystem.

## Participation

You can help this effort in several ways:

- If there is a missing API to enable certain dweb protocol please submit an issue with clear description of:

  1. What protocol implementation requires it.
  2. What is this API would protocol implementation allow / prevent.

- Contribute code. Make sure to reach out first, then hack.

## Status: In active development

| API | Status |
| --- | --- |
| [Protocol Handler][] | 🐣 |
| [mdns][] | 🥚 |
| [UDP Socket][] | 🥚 |
| [TCP Socket][] | 🥚 |
| [µTP Socket] | 🥚 |
| [File System][] | 🥚 |



- 🥚 : In design phase
- 🐣 : Work in progress
- 🐥 : Try it out
- 🐓 : Usable


You can try this out by colning the repo and running a following command that requires [web-ext][] tool:

```
export MOZ_DISABLE_CONTENT_SANDBOX=1; web-ext run --firefox=/Applications/FirefoxNightly.app/Contents/MacOS/firefox-bin
```

[travis.icon]: https://travis-ci.org/Gozala/libdweb.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/libdweb
[version.icon]: https://img.shields.io/npm/v/libdweb.svg
[downloads.icon]: https://img.shields.io/npm/dm/libdweb.svg
[package.url]: https://npmjs.org/package/libdweb
[downloads.image]: https://img.shields.io/npm/dm/libdweb.svg
[downloads.url]: https://npmjs.org/package/libdweb
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier

[webextension experiments]:https://webextensions-experiments.readthedocs.io/en/latest/index.html
[new APIs]:https://wiki.mozilla.org/WebExtensions/NewAPIs
[Protocol Handler]:https://github.com/Gozala/libdweb/issues/2
[UDP Socket]:https://github.com/Gozala/libdweb/issues/4
[TCP Socket]:https://github.com/Gozala/libdweb/issues/5
[µTP Socket]:https://github.com/Gozala/libdweb/issues/6
[mdns]:https://github.com/Gozala/libdweb/issues/7
[File System]:https://github.com/Gozala/libdweb/issues/8
[web-ext]:https://www.npmjs.com/package/web-ext
