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

const accessFrom = ({ readable, writable, watchable }) /*:string*/ => {
  let params = []
  if (readable) {
    params.push("read")
  }
  if (writable) {
    params.push("write")
  }
  if (watchable) {
    params.push("watch")
  }

  return params.join("&")
}

const normalizeFileURL = (href) /*: string*/ => {
  // const fileURI = Services.io
  //   .newURI(href, null, null)
  //   .QueryInterface(Ci.nsIFileURL)
  // console.log("normalizeURL", href, fileURI)
  // const path = OS.Path.fromFileURI(fileURI.spec)
  const path = OS.Path.fromFileURI(href)
  return `file://${path}/`
}

const requestDirectoryAccess = (options) /*:Promise<string>*/ =>
  new Promise((resolve, reject) => {
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
          return reject(new ExtensionError("User denied directory access"))
      }
    })
  })

const updatePermissions = async (volume /*: Volume*/, extension) => {
  const permissions = []
  const { url, readable, writable, watchable } = volume
  if (readable) {
    permissions.push(`read+${url}`)
  }
  if (writable) {
    permissions.push(`write+${url}`)
  }
  if (watchable) {
    permissions.push(`watch+${url}`)
  }

  await ExtensionPermissions.add(extension, { permissions, origins: [] })
}

const getPermissions = async (url, extension) => {
  const { permissions } = await ExtensionPermissions.get(extension)
  return {
    url,
    readable: permissions.includes(`read+${url}`),
    writable: permissions.includes(`write+${url}`),
    watchable: permissions.includes(`watch+${url}`)
  }
}

const requestPermissions = async (options, extension) => {
  const url = await requestDirectoryAccess(options)
  return await granPermissions(url, options, extension)
}

const granPermissions = async (url, options, extension) => {
  const volume = createVolume(url, options)
  await updatePermissions(volume, extension)
  return volume
}

const createVolume = (url, options) => {
  return {
    url,
    readable: options.read != false,
    writable: options.write === true,
    watchable: options.watch === true
  }
}

const requestVirtualVolume = async (options, extension) => {
  const url = extension.getURL(".")
  const volume = {
    url,
    readable: options.read != false,
    writable: options.write === true,
    watchable: options.watch === true
  }
  await updatePermissions(volume, extension)
  return volume
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

const promptPermissions = (
  options /*:MountOptions*/,
  context /*:BaseContext*/
) =>
  new Promise(async (resolve, reject) => {
    const browser = getTabBrowser(
      context.pendingEventBrowser || context.xulBrowser
    )
    const addon = await AddonManager.getAddonByID(context.extension.id)

    const name = context.extension.name
    const icon = addon.iconURL || DEFAULT_EXTENSION_ICON
    let permissions = []
    if (options.read != false) {
      permissions.push("read")
    }
    if (options.write === true) {
      permissions.push("write")
    }
    if (options.watch === true) {
      permissions.push("watch")
    }

    console.log("!!!!!!!!!!!!", addon)

    browser.ownerGlobal.PopupNotifications.show(
      browser,
      "libdweb-fs-popup",
      `${name} is requesting permission to ${permissions.join(
        ", "
      )} files in a local directory`,
      null,
      {
        label: "Choose directory",
        accessKey: "C",
        callback() {
          requestPermissions(options, context.extension).then(resolve, reject)
        }
      },
      [
        {
          label: "Deny permission",
          accessKey: "D",
          callback() {
            reject(new ExtensionError("User denied directory access"))
          }
        }
      ],
      {
        persistence: false,
        popupIconURL: icon
      }
    )
  })

const promptAdditonalPermissions = (
  url /*:string*/,
  options /*:MountOptions*/,
  context /*:BaseContext*/
) =>
  new Promise(async (resolve, reject) => {
    const browser = getTabBrowser(
      context.pendingEventBrowser || context.xulBrowser
    )
    const addon = await AddonManager.getAddonByID(context.extension.id)

    const name = context.extension.name
    const icon = addon.iconURL || DEFAULT_EXTENSION_ICON
    let permissions = []
    if (options.read != false) {
      permissions.push("read")
    }
    if (options.write === true) {
      permissions.push("write")
    }
    if (options.watch === true) {
      permissions.push("watch")
    }
    console.log("!!!!!!!!!!!!", addon)

    browser.ownerGlobal.PopupNotifications.show(
      browser,
      "libdweb-fs-popup",
      `${name} is requesting permission to ${permissions.join(
        ", "
      )} files in a local directory: ${url}`,
      null,
      {
        label: "Grant permissions",
        accessKey: "C",
        callback() {
          granPermissions(url, options, context.extension).then(resolve, reject)
        }
      },
      [
        {
          label: "Deny permission",
          accessKey: "D",
          callback() {
            reject(new ExtensionError("User denied directory access"))
          }
        }
      ],
      {
        persistence: false,
        popupIconURL: icon
      }
    )
  })

class HostFileSystem extends ExtensionAPI /*::<Host>*/ {
  getAPI(context) {
    return {
      FileSystem: {
        async mount(options /*:MountOptions*/) /*:Promise<Volume>*/ {
          if (options.url) {
            const volume = await getPermissions(
              normalizeFileURL(options.url),
              context.extension
            )

            console.log("Granted permissions", volume)

            const { writable, readable, watchable } = volume
            if (!writable && !readable && !watchable) {
              throw new ExtensionError(
                "Access to the requested directory was not granted."
              )
            } else if (
              options.read === readable &&
              options.write === writable &&
              options.watch === watchable
            ) {
              return volume
            } else {
              const volume = await promptAdditonalPermissions(
                options.url,
                options,
                context
              )
              return volume
            }
          } else {
            console.log("Request permissions", options)
            const volume = await promptPermissions(options, context)

            return volume
          }
        }
      }
    }
  }
}

global.FileSystem = HostFileSystem
