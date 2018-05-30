// @flow
/*::
import { Cu, Cr, Ci, Cc } from "gecko"
import { ExtensionAPI, BaseContext, ExtensionError } from "gecko"
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
const { ExtensionPermissions } = Cu.import(
  "resource://gre/modules/ExtensionPermissions.jsm",
  {}
)

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
  const fileURI = Services.io
    .newURI(href, null, null)
    .QueryInterface(Ci.nsIFileURL)
  const path = OS.Path.fromFileURI(fileURI)
  return `file://${path}`
}

const requestDirectoryAccess = (window, options) =>
  new Promise((resolve, reject) => {
    const filePicker = Cc["@mozilla.org/filepicker;1"].createInstance(
      Ci.nsIFilePicker
    )

    filePicker.init(window, options.title, Ci.nsIFilePicker.modeGetFolder)
    filePicker.open(status => {
      switch (status) {
        case Ci.nsIFilePicker.returnOK:
        case Ci.nsIFilePicker.returnReplace:
          return resolve(filePicker.fileURL.spec)
        case Ci.nsIFilePicker.returnCancel:
        default:
          return reject(Error("User denied access"))
      }
    })
  })

const updatePermissions = (volume /*: Volume*/) => {
  const access = accessFrom(volume)
  const permission = `${volume.url}?${access}`
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

const requestPermissions = async (window, options) => {
  return requestDirectoryAccess(window, options)
}

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
            if (!volume.readable && !volume.writable && !volume.watchable) {
              throw new Error(
                "Access to the requested directory was not granted."
              )
            }
            return volume
          } else {
            const url = await requestPermissions(context.contentWindow, options)
            const volume = {
              url,
              readable: options.read != false,
              writable: options.write == true,
              watchable: options.watch == true
            }

            return volume
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
