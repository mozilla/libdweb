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

interface FileSystemSupervisor {

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

    filePicker.init(window, options.title, Ci.nsIFilePicker.modeGetFolder)
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
  const volume = {
    url,
    readable: options.read != false,
    writable: options.write === true,
    watchable: options.watch === true
  }
  await updatePermissions(volume, extension)
  return volume
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
  new Promise((resolve, reject) => {
    const browser = getTabBrowser(
      context.pendingEventBrowser || context.xulBrowser
    )
    const name = context.extension.name
    const icon = context.extension.iconURL || DEFAULT_EXTENSION_ICON
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

    browser.ownerGlobal.PopupNotifications.show(
      browser,
      "libdweb-fs-popup",
      `${name} is requesting permission to ${permissions.join(
        ", "
      )} files in a local directory`,
      null,
      {
        label: "Allow",
        accessKey: "A",
        callback() {
          requestVirtualVolume(options, context.extension).then(resolve, reject)
        }
      },
      [
        {
          label: "Choose directory",
          accessKey: "C",
          callback() {
            requestPermissions(options, context.extension).then(resolve, reject)
          }
        },
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

{
  const self /*:window*/ = this
  self.FileSystem = class ExtensionAPI /*::<FileSystemSupervisor>*/ {
    getAPI(context /*:BaseContext*/) {
      return {
        FileSystem: {
          async mount(options /*:MountOptions*/) /*:Promise<Volume>*/ {
            if (options.url) {
              const volume = await getPermissions(
                normalizeFileURL(options.url),
                context.extension
              )

              console.log("Granted permissions", volume)

              if (!volume.readable && !volume.writable && !volume.watchable) {
                throw new ExtensionError(
                  "Access to the requested directory was not granted."
                )
              }
              return volume
            } else {
              console.log("Request permissions", options)
              const volume = await requestPermissions(
                options,
                context.extension
              )

              return volume
            }
          }
        }
      }
    }
  }
}

// Cu.import("resource://gre/modules/ExtensionPermissions.jsm")
// Cu.import("resource://gre/modules/AddonManager.jsm")
// Cu.import("resource://gre/modules/ExtensionParent.jsm")

// ExtensionPermissions.get

// addon = AddonManager.getAddonByID('698aaa1d0cb11d90b1d3b7b0b5cbd9052ca1d09c@temporary-addon').then($ => addon = $)

// addons = AddonManager.getAllAddons().then($ => addons = $)

// addons[9].__AddonInternal__
// addon.startupPromise

// inst = AddonManager.getAllInstalls().then($ => inst = $)

// ext = {id:"698aaa1d0cb11d90b1d3b7b0b5cbd9052ca1d09c@temporary-addon"}
// perm = ExtensionPermissions.get({id:"137562a2-595e-1840-ba66-3e61beebf12f"})

// ExtensionParent.StartupCache

// p = ExtensionPermissions.add(ext, {
//   permissions: [
//     "filesystem:///Users/gozala/Projects/libdweb/#rwo"
//   ],
//   origins: [

//   ]
// })

// p1 = ExtensionPermissions.get(ext)

// /*
// async add(extension, perms) {
//     let {permissions, origins} = await this._getCached(extension);

//     let added = emptyPermissions();

//     for (let perm of perms.permissions) {
//       if (!permissions.includes(perm)) {
//         added.permissions.push(perm);
//         permissions.push(perm);
//       }
//     }

//     for (let origin of perms.origins) {
//       origin = new MatchPattern(origin, {ignorePath: true}).pattern;
//       if (!origins.includes(origin)) {
//         added.origins.push(origin);
//         origins.push(origin);
//       }
//     }

//     if (added.permissions.length > 0 || added.origins.length > 0) {
//       this._saveSoon(extension);
//       extension.emit("add-permissions", added);
//     }
//   }
// */

// url = new URL('file:///Users////gozala/Projects/libdweb/')

// url.search = `?read&write&watch`

// url.searchParams.set('write', '')
// [...url.searchParams.keys()]

// uri = Services.io.newURI('file:///Users/gozala////Projects/libdweb/#rwo')
//   .QueryInterface(Ci.nsIFileURL)
//   .resolve('foo')

// OS.Path.toFileURI('file:///Users/gozala////Projects/libdweb/?read&write&watch'.substr('file://'.length))
