// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext} from "gecko"
import type {
  FileSystemManager,
  FileSystem,
  Mode,
  OpenOptions,
  MountOptions,
  Path,
  ReadOptions,
  DirOptions,
  Dates,
  Stat,
  Entry,
  Volume,
  Permissions
} from "./API"

interface Host {
  +FileSystem: {
    mount(MountOptions):Promise<Volume>
  }
}
*/
Cu.importGlobalProperties(["URL"])
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})
const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)
const { ExtensionPermissions } = Cu.import(
  "resource://gre/modules/ExtensionPermissions.jsm",
  {}
)
const { ExtensionsUI } = Cu.import("resource:///modules/ExtensionsUI.jsm", {})
const { AddonManager } = Cu.import(
  "resource://gre/modules/AddonManager.jsm",
  {}
)

const { ExtensionError } = ExtensionUtils

const DEFAULT_EXTENSION_ICON =
  "chrome://mozapps/skin/extensions/extensionGeneric.svg"

const normalizeFileURL = (href) /*: string*/ => {
  // const fileURI = Services.io
  //   .newURI(href, null, null)
  //   .QueryInterface(Ci.nsIFileURL)
  // console.log("normalizeURL", href, fileURI)
  // const path = OS.Path.fromFileURI(fileURI.spec)
  const path = OS.Path.fromFileURI(href)
  return `file://${path}/`
}

const getTabBrowser = target => {
  let browser = target
  while (
    browser.ownerDocument.docShell.itemType !== Ci.nsIDocShell.typeChrome
  ) {
    browser = browser.ownerDocument.docShell.chromeEventHandler
  }
  return browser
}

const FS_PERMISSON_PATTERN = /^(read|write|watch)\+(file:\/\/[\s\S]*)$/

const dict = /*::<a>*/ () /*:{[string]:a}*/ => {
  const empty /*:Object*/ = Object.create(null)
  return empty
}

/*::
interface PromptAction {
  label: string;
  accessKey: string;
  callback?: ?() => void;
}
*/

class FSVolume /*::implements Volume*/ {
  /*::
  url:string
  readable:boolean
  writable:boolean
  watchable:boolean
  */
  static new(url, readable = false, writable = false, watchable = false) {
    return new this(url, readable, writable, watchable)
  }
  static grant(volume /*:Volume*/, options /*:MountOptions*/) /*:FSVolume*/ {
    return new this(
      volume.url,
      volume.readable || options.read != false,
      volume.writable || options.write === true,
      volume.watchable || options.watch === true
    )
  }
  constructor(url, readable, writable, watchable) {
    this.url = url
    this.readable = readable
    this.writable = writable
    this.watchable = watchable
  }
}

class FileStat {
  static encode(stat) {
    return {
      isDir: stat.isDir,
      isSymLink: stat.isSymLink,
      size: stat.size,
      lastAccessDate: stat.lastAccessDate,
      lastModificationDate: stat.lastModificationDate,

      unixOwner: stat.unixOwner,
      unixGroup: stat.unixGroup,
      unixMode: stat.unixMode,
      unixLastStatusChangeDate: stat.unixLastStatusChangeDate,

      winBirthDate: stat.winBirthDate,
      winAttributes: stat.winAttributes
    }
  }
}

class HostFileSystem {
  /*::
  context:BaseContext
  state: Promise<{
    volumes:{[string]:FSVolume},
    name:string,
    iconURL:string
  }>
  */
  constructor(context /*:BaseContext*/) {
    this.context = context
  }

  async init() {
    const { context } = this
    const { extension } = context
    const { name, id } = extension
    const addon = await AddonManager.getAddonByID(id)
    const iconURL = addon.iconURL || DEFAULT_EXTENSION_ICON

    const volumes /*:{[string]:FSVolume}*/ = dict()

    const permissions /*: string[]*/ = await this.getPermissions()

    for (const permission of permissions) {
      const match = permission.match(FS_PERMISSON_PATTERN)

      if (match) {
        const [, flag, url] = match
        const volume = volumes[url] || (volumes[url] = FSVolume.new(url))
        switch (flag) {
          case "read":
            volume.readable = true
            break
          case "write":
            volume.writable = true
            break
          case "watch":
            volume.watchable = true
            break
        }
      }
    }

    return { volumes, name, iconURL }
  }
  addPermissions(permissions /*:string[]*/) {
    return ExtensionPermissions.add(this.context.extension, {
      permissions,
      origins: []
    })
  }
  async getPermissions() /*:Promise<string[]>*/ {
    const result = await ExtensionPermissions.get(this.context.extension)
    return await result.permissions
  }

  promptUser /*::<a:PromptAction>*/(
    options /*:{id:string, message:string, actions:a[]}*/
  ) /*:Promise<a>*/ {
    const browser = Services.wm.getMostRecentWindow("navigator:browser")

    debug && console.log("HostFileSystem.promptUser", options, browser)

    return new Promise((resolve, reject) => {
      const [primary, ...secondary] = options.actions.map(action => {
        action.callback = () => resolve(action)
        return action
      })

      browser.PopupNotifications.show(
        browser.gBrowser.selectedBrowser,
        options.id,
        options.message,
        null,
        primary,
        secondary,
        options
      )
    })
  }
  requestDirectory() /*:Promise<?string>*/ {
    return new Promise((resolve, reject) => {
      const filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(
        Ci.nsIFilePicker
      )

      const window = Services.wm.getMostRecentWindow("navigator:browser")

      filePicker.init(window, "", Ci.nsIFilePicker.modeGetFolder)
      filePicker.open(status => {
        switch (status) {
          case Ci.nsIFilePicker.returnOK:
          case Ci.nsIFilePicker.returnReplace:
            return resolve(filePicker.fileURL.spec)
          case Ci.nsIFilePicker.returnCancel:
          default:
            return resolve(null)
        }
      })
    })
  }
  async requestVolume(options /*:MountOptions*/) {
    const { name, iconURL, volumes } = await this.state

    const rights = []
    const permissions = []
    if (options.read != false) {
      rights.push("read")
    }
    if (options.write === true) {
      rights.push("write")
    }
    if (options.watch === true) {
      rights.push("watch")
    }
    const access = rights.join(", ")

    debug && console.log("!!!!!!!!!!!!", this)

    const { grant } = await this.promptUser({
      id: "libdweb-fs-popup",
      message: `${name} is requesting permission to ${access} files in a local directory`,
      persistence: false,
      popupIconURL: iconURL,
      actions: [
        {
          label: "Choose directory",
          accessKey: "C",
          grant: true
        },
        {
          label: "Deny permission",
          accessKey: "D",
          grant: false
        }
      ]
    })

    if (grant) {
      const url = await this.requestDirectory()
      if (url == null) {
        throw new ExtensionError("User denied directory access")
      } else {
        const permissions = rights.map(flag => `${flag}+${url}`)
        await this.addPermissions(permissions)

        const volume = FSVolume.new(
          url,
          options.read != false,
          options.write === true,
          options.watch === true
        )
        volumes[url] = volume
        return volume
      }
    } else {
      throw new ExtensionError("User denied directory access")
    }
  }
  async requestPermissions(
    url /*:string*/,
    options /*:MountOptions*/,
    volume /*:Volume*/
  ) {
    const rights = []
    const permissions = []

    if (!volume.readable && options.read != false) {
      rights.push("read")
      permissions.push(`read+${url}`)
    }

    if (!volume.writable && options.write) {
      rights.push("write")
      permissions.push(`write+${url}`)
    }

    if (!volume.watchable && options.watch) {
      rights.push("watch")
      permissions.push(`watch+${url}`)
    }

    if (rights.length === 0) {
      return true
    } else {
      debug && console.log(`request additional permissions`, permissions)
      const access = rights.join(", ")
      const { name, iconURL, volumes } = await this.state

      const { grant } = await this.promptUser({
        message: `${name} is requesting additonal permission to ${access} files in a local directory: ${url}`,
        persistence: false,
        popupIconURL: iconURL,
        id: "libdweb-fs-popup",
        actions: [
          {
            label: "Grant permissions",
            accessKey: "G",
            grant: true
          },
          {
            label: "Deny permission",
            accessKey: "D",
            grant: false
          }
        ]
      })

      if (grant) {
        await this.addPermissions(permissions)
        volumes[url] = FSVolume.grant(volume, options)

        return true
      } else {
        return false
      }
    }
  }

  async mount(options /*:MountOptions*/) /*:Promise<Volume>*/ {
    debug && console.log(">> Host.mount", options)
    const { url } = options
    if (url) {
      const { volumes } = await this.state
      const available = volumes[url]

      debug && console.log("Granted permissions", available, volumes)
      if (available == null) {
        throw new ExtensionError(
          "Access to the requested directory was not granted."
        )
      } else {
        const grant = await this.requestPermissions(url, options, available)

        if (grant) {
          return volumes[url]
        } else {
          throw new ExtensionError(
            "Requested permissions to the directory were not granted."
          )
        }
      }
    } else {
      debug && console.log("Request permissions", options)
      const volume = await this.requestVolume(options)
      debug && console.log("Host.mount <<<", volume)
      return volume
    }
  }

  async resolve(url /*:string*/, access) {
    const fileURL = normalizeFileURL(url)
    const { volumes } = await this.state
    for (const volumeURL in volumes) {
      if (fileURL.startsWith(volumeURL)) {
        return OS.Path.fromFileURI(fileURL)
      }
    }
    throw new ExtensionError(`Access to ${fileURL} requires user permission`)
  }
  async open(url, mode, options) /*:Promise<{}>*/ {
    try {
      debug && console.log(">> Host.open", url, mode, options)
      const path = await this.resolve(url, mode)
      const file = await OS.File.open(
        path,
        mode,
        options != null ? options : undefined
      )
      debug && console.log("<< Host.open", file)
      return file
    } catch (error) {
      throw new ExtensionError(error)
    }
  }
  async close(file) {
    try {
      debug && console.log(">> Host.close", file)
      await OS.File.prototype.close.call(file)
    } catch (error) {
      throw new ExtensionError(error)
    }
  }
  async read(file, options) {
    try {
      debug && console.log(">> Host.read", file, options)
      if (options && options.offset != null) {
        await OS.File.prototype.setPosition.call(
          file,
          options.offset,
          OS.File.POS_START
        )
      }
      const content = await OS.File.prototype.read.call(
        file,
        options && options.size
      )

      debug && console.log(">> Host.read", content)
      // When offset is at the end of the file read will produce
      // Uint8Array instance for the fragment of the underlaying buffer.
      const { buffer, byteOffset, byteLength } = content
      if (byteLength < buffer.byteLength) {
        return buffer.slice(byteOffset, byteLength)
      } else {
        return buffer
      }
    } catch (error) {
      return new ExtensionError(error)
    }
  }
  async write(file, content, options) {
    try {
      debug && console.log(">> Host.write", file, content, options)
      if (options && options.offset != null) {
        console.log(">> Host.setPosition", file, options.offset)
        await OS.File.prototype.setPosition.call(
          file,
          options.offset,
          OS.File.POS_START
        )
      }

      return await OS.File.prototype.write.call(file, new DataView(content), {
        bytes: options && options.size
      })
    } catch (error) {
      return new ExtensionError(error)
    }
  }
  async stat(file) {
    try {
      debug && console.log(">> Host.stat", file)
      const stat /*: Object*/ = await OS.File.prototype.stat.call(file)
      debug && console.log("<< Host.stat", stat)
      return FileStat.encode(stat)
    } catch (error) {
      throw new ExtensionError(error)
    }
  }
  async flush(file) {
    try {
      debug && console.log(">> Host.fluh", file)
      return OS.File.prototype.flush.call(file)
    } catch (error) {
      throw new ExtensionError(error)
    }
  }
  async setDates(file, dates) {
    try {
      debug && console.log(">> Host.setDates", file, dates)
      return await OS.File.prototype.setDates.call(
        file,
        dates.access,
        dates.modification
      )
    } catch (error) {
      throw new ExtensionError(error)
    }
  }
  async byteOffset(file) {
    try {
      debug && console.log(">> Host.byteOffset", file)
      return await OS.File.prototype.getPosition.call(file)
    } catch (error) {
      throw new ExtensionError(error)
    }
  }

  static new(context /*:BaseContext*/) {
    const fs = new this(context)
    fs.state = fs.init()
    return fs
  }
}

global.FileSystem = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    const fs = HostFileSystem.new(context)
    return {
      FileSystem: {
        mount: options => fs.mount(options),
        open: (url, mode, options) => fs.open(url, mode, options),
        close: file => fs.close(file),
        read: (file, options) => fs.read(file, options),
        write: (file, content, options) => fs.write(file, content, options),
        stat: file => fs.stat(file),
        byteOffset: file => fs.byteOffset(file),
        setDates: (file, dates) => fs.setDates(file, dates)
      }
    }
  }
}

const debug = true
