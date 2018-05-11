# libdweb

[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

Experimental WebExtensions API for enabling DWeb protocols

## Usage

```
export MOZ_DISABLE_CONTENT_SANDBOX=1; web-ext run --firefox=/Applications/FirefoxNightly.app/Contents/MacOS/firefox-bin
```

### Import

Rest of the the document & provided code examples assumes that library is installed (with yarn or npm) and imported as follows:

```js
import * as libdweb from "libdweb"
```

## Install

    npm install libdweb

[travis.icon]: https://travis-ci.org/Gozala/libdweb.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/libdweb
[version.icon]: https://img.shields.io/npm/v/libdweb.svg
[downloads.icon]: https://img.shields.io/npm/dm/libdweb.svg
[package.url]: https://npmjs.org/package/libdweb
[downloads.image]: https://img.shields.io/npm/dm/libdweb.svg
[downloads.url]: https://npmjs.org/package/libdweb
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
