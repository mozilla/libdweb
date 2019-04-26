// @flow strict

/*::
import { Cu, Cr, Ci, Cc, ExtensionAPI } from "gecko"
import type {BaseContext} from "gecko"
import type {
  FileSystemManager,
  FileManager,
  Mode,
  OpenOptions,
  MountOptions,
  ReadOptions,
  WriteOptions,
  CreateDirOptions,
  RemoveFileOptions,
  CopyOptions,
  MoveOptions,
  WatchOptions,
  ReadDirOptions,
  RemoveDirOptions,
  Dates,
  Stat,
  Entry,
  Volume,
  Permissions,
  Readable,
  Writable,
  File
} from "../interface/fs"

interface Host {
  +File: FileManager;
  +FileSystem: FileSystemManager;
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

const watcherService = Cc[
  "@mozilla.org/toolkit/filewatcher/native-file-watcher;1"
].getService(Ci.nsINativeFileWatcherService)

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

class IOError extends ExtensionError {
  /*::
  operation:string;
  becauseExists:boolean;
  becauseNoSuchFile:boolean;
  becauseClosed:boolean;
  code:number;
  */
  static throw(error) /*:empty*/ {
    const self = new this(error.message)
    self.operation = self.operation
    self.becauseExists = error.becauseExists
    self.becauseNoSuchFile = error.becauseNoSuchFile
    self.becauseClosed = error.becauseClosed
    self.code = error.unixErrno || error.winLastError || -1
    throw self
  }
}

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
  static encode(stat) /*:Stat*/ {
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

class DirectoryEntry {
  static encode(entry) {
    return {
      isDir: entry.isDir,
      isSymLink: entry.isSymLink,
      name: entry.name,
      url: OS.Path.toFileURI(entry.path),
      winLastAccessDate: entry.winLastAccessDate,
      winCreationDate: entry.winCreationDate,
      winLastWriteDate: entry.winLastWriteDate
    }
  }
}

class Watcher {
  /*::
  id:string
  path:string
  recursive:boolean
  context:BaseContext
  */
  constructor(
    id /*:string*/,
    path /*:string*/,
    recursive /*:boolean*/,
    context /*:BaseContext*/
  ) {
    this.id = id
    this.path = path
    this.recursive = recursive
    this.context = context
  }
  changed(file, flags) {
    const { path, recursive, id } = this
    if (recursive || path === file) {
      const url = `file://${file}`
      const address = `libdweb/FileSystem/Watcher/notify`
      this.context.parentMessageManager.sendAsyncMessage(address, {
        url,
        flags,
        id
      })
    }
  }
  static new(id, path, recursive, context) {
    const watcher = new Watcher(id, path, recursive, context)

    return new Promise((resolve, reject) => {
      watcherService.addPath(
        path,
        watcher,
        (xpcomError, osError) => reject(xpcomError),
        resourcePath => resolve(watcher)
      )

      resolve(watcher)
    })
  }
  terminate() {
    return new Promise((resolve, reject) => {
      console.log("FileSystemHost.Watcher.terminate")
      watcherService.removePath(
        this.path,
        this,
        (xpcomError, osError) => reject(xpcomError),
        resourcePath => resolve()
      )
    })
  }
}

class HostFileSystem /*::implements FileSystemManager*/ {
  /*::
  File:FileManager
  context:BaseContext
  state: Promise<{
    nextWatcherID: number;
    watchers:{[string]:Watcher},
    volumes:{[string]:FSVolume},
    name:string,
    iconURL:string
  }>
  */
  constructor(context /*:BaseContext*/) {
    this.context = context
    this.File = new HostFileManager()
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

    const watchers /*:Object*/ = Object.create(null)
    const nextWatcherID = 0

    return { volumes, name, iconURL, watchers, nextWatcherID }
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
  async open(url, mode /*:Object*/, options /*:?Object*/) /*:any*/ {
    try {
      debug && console.log(">> Host.open", url, mode, options)
      const path = await this.resolve(url, mode)
      const file = await OS.File.open(
        path,
        mode,
        options != null ? options : undefined
      )
      debug && console.log("<< Host.open", file)
      const theFile /*:any*/ = file
      return theFile
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async readFile(url, options /*::?:ReadOptions*/) /*:Promise<ArrayBuffer>*/ {
    const fs /*:FileSystemManager*/ = this
    try {
      const file = await fs.open(url, { read: true })
      try {
        return await this.File.read(file, options)
      } finally {
        await this.File.close(file)
      }
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async writeFile(
    url,
    content /*:ArrayBuffer*/,
    options /*::?:WriteOptions*/
  ) /*:Promise<number>*/ {
    const fs /*:FileSystemManager*/ = this
    try {
      const file = await fs.open(url, { write: true })
      try {
        return await this.File.write(file, content, options)
      } finally {
        await this.File.close(file)
      }
    } catch (error) {
      return IOError.throw(error)
    }
  }

  async removeFile(url, options /*::?:RemoveFileOptions*/) /*: Promise<void>*/ {
    try {
      const file = await this.resolve(url)
      return await OS.File.remove(file, options)
    } catch (error) {
      return IOError.throw(error)
    }
  }

  async setDates(url, dates /*::?:Object*/) /*: Promise<void>*/ {
    try {
      const file = await this.resolve(url)

      return await OS.File.setDates(
        file,
        dates && dates.access,
        dates && dates.modification
      )
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async setPermissions(url, permissions /*:Permissions*/) /*:Promise<void>*/ {
    try {
      const file = await this.resolve(url)
      return await OS.File.setPermissions(file, permissions)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async stat(url) /*: Promise<Stat>*/ {
    try {
      const file = await this.resolve(url)
      return await OS.File.stat(file)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async copy(from, to, options /*::?:CopyOptions*/) /*:Promise<void>*/ {
    try {
      const fromFile = await this.resolve(from)
      const toFile = await this.resolve(to, true)
      return await OS.File.copy(fromFile, toFile, options)
    } catch (error) {
      return IOError.throw(error)
    }
  }

  async move(from, to, options /*::?:MoveOptions*/) /*:Promise<void>*/ {
    try {
      const fromFile = await this.resolve(from)
      const toFile = await this.resolve(to, true)
      return await OS.File.move(fromFile, toFile, options)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async createSymbolicLink(from, to) /*:Promise<void>*/ {
    try {
      const fromFile = await this.resolve(from)
      const toFile = await this.resolve(to, true)
      return await OS.File.unixSymLink(fromFile, toFile)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async exists(url) /*:Promise<boolean>*/ {
    try {
      const file = await this.resolve(url)
      return await OS.File.exists(file)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async watch(
    url,
    options /*::?:WatchOptions*/
  ) /*:Promise<AsyncIterator<string>>*/ {
    throw new ExtensionError("Not Implemented")
  }
  async startWatcher(url, options /*::?:WatchOptions*/) /*:Promise<string>*/ {
    try {
      const file = await this.resolve(url)
      const state = await this.state
      const recursive = !!(options && options.recursive)
      const id = `Watcher@${++state.nextWatcherID}`
      const watcher = await Watcher.new(id, file, recursive, this.context)
      state.watchers[id] = watcher
      return id
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async stopWatcher(id) /*:Promise<void>*/ {
    try {
      const state = await await this.state
      const watchers = state.watchers
      const watcher = watchers[id]
      delete watchers[id]
      if (watcher) {
        await watcher.terminate()
      }
    } catch (error) {
      return IOError.throw(error)
    }
  }

  async createDirectory(
    url,
    options /*::?: CreateDirOptions*/
  ) /*: Promise<void>*/ {
    try {
      const file = await this.resolve(url)
      return await OS.File.makeDir(file, options || undefined)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async removeDirectory(
    url,
    options /*::?: RemoveDirOptions*/
  ) /*: Promise<void>*/ {
    try {
      const file = await this.resolve(url)
      if (options && options.recursive) {
        return await OS.File.removeDir(file, options)
      } else {
        return await OS.File.removeEmptyDir(file, options)
      }
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async readDirectory(
    url,
    options /*::?:ReadDirOptions*/
  ) /*: Promise<Entry[]>*/ {
    try {
      const file = await this.resolve(url)
      const directory = new OS.File.DirectoryIterator(file, options)
      const entries = await await directory.nextBatch()
      directory.close()
      return entries.map(DirectoryEntry.encode)
    } catch (error) {
      return IOError.throw(error)
    }
  }

  static new(context /*:BaseContext*/) {
    const fs = new this(context)
    fs.state = fs.init()
    return fs
  }
}

class HostFileManager /*::implements FileManager*/ {
  async close(file /*:File*/) /*:Promise<void>*/ {
    try {
      debug && console.log(">> Host.close", file)
      await OS.File.prototype.close.call(file)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async read(
    file /*:Readable*/,
    options /*::?:ReadOptions*/
  ) /*:Promise<ArrayBuffer>*/ {
    try {
      debug && console.log(">> Host.read", file, options)
      if (options && options.position != null) {
        await OS.File.prototype.setPosition.call(
          file,
          options.position,
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
      return IOError.throw(error)
    }
  }
  async write(
    file /*:Writable*/,
    content /*:ArrayBuffer*/,
    options /*::?:WriteOptions*/
  ) /*:Promise<number>*/ {
    try {
      debug && console.log(">> Host.write", file, content, options)
      if (options && options.position != null) {
        await OS.File.prototype.setPosition.call(
          file,
          options.position,
          OS.File.POS_START
        )
      }

      const size = options && options.size
      const writeOptions = size ? { bytes: size } : undefined
      return await OS.File.prototype.write.call(
        file,
        new DataView(content),
        writeOptions
      )
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async stat(file) /*:Promise<Stat>*/ {
    try {
      debug && console.log(">> Host.stat", file)
      const stat /*:Object*/ = await OS.File.prototype.stat.call(file)
      debug && console.log("<< Host.stat", stat)
      return FileStat.encode(stat)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async flush(file /*:File*/) /*:Promise<void>*/ {
    try {
      debug && console.log(">> Host.fluh", file)
      return OS.File.prototype.flush.call(file)
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async setDates(file, dates /*:?Object*/) {
    try {
      debug && console.log(">> Host.setDates", file, dates)
      return await OS.File.prototype.setDates.call(
        file,
        dates && dates.access,
        dates && dates.modification
      )
    } catch (error) {
      return IOError.throw(error)
    }
  }
  async getPosition(file /*:File*/) /*:Promise<number>*/ {
    try {
      debug && console.log(">> Host.getPosition", file)
      return await OS.File.prototype.getPosition.call(file)
    } catch (error) {
      return IOError.throw(error)
    }
  }
}

global.FileSystem = class extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    const fs = HostFileSystem.new(context)

    return {
      File: {
        close: file => fs.File.close(file),
        flush: file => fs.File.flush(file),
        getPosition: file => fs.File.getPosition(file),
        stat: file => fs.File.stat(file),
        setDates: (file, dates) => fs.File.setDates(file, dates),
        read: (file, options) => fs.File.read(file, options),
        write: (file, content, options) => fs.File.write(file, content, options)
      },
      FileSystem: {
        mount: options => fs.mount(options),
        open: (url, mode, options) => fs.open(url, mode, options),
        readFile: (url, options) => fs.readFile(url, options),
        writeFile: (url, content, options) =>
          fs.writeFile(url, content, options),
        removeFile: (url, options) => fs.removeFile(url, options),

        setDates: (url, dates) => fs.setDates(url, dates),
        setPermissions: (url, permissions) =>
          fs.setPermissions(url, permissions),
        stat: url => fs.stat(url),
        copy: (from, to, options) => fs.copy(from, to, options),
        move: (from, to, options) => fs.move(from, to, options),
        createSymbolicLink: (from, to) => fs.createSymbolicLink(from, to),
        exists: url => fs.exists(url),
        watch: (url, options) => fs.watch(url, options),

        createDirectory: (url, options) => fs.createDirectory(url, options),
        removeDirectory: (url, options) => fs.removeDirectory(url, options),
        readDirectory: (url, options) => fs.readDirectory(url, options),

        startWatcher: (url, options) => fs.startWatcher(url, options),
        stopWatcher: id => fs.stopWatcher(id)
      }
    }
  }
}

const debug = true
