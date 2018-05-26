// @flow
/*::
import { Cu, Cr, Ci, nsIFileURL } from "gecko"
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
  Permissions
} from "./API"

interface FileSystemSupervisor {

}

interface Volume {
  url:URL
}
*/
Cu.importGlobalProperties(["URL"])
const { Services } = Cu.import("resource://gre/modules/Services.jsm", {})
const { OS } = Cu.import("resource://gre/modules/osfile.jsm", {})

const accessFrom = ({ read, write, watch }) /*:string*/ => {
  let params = []
  if (read !== false) {
    params.push("read")
  }
  if (write) {
    params.push("write")
  }
  if (watch) {
    params.push("watch")
  }

  return params.join("&")
}

const normalizeFileURL = (href): string => {
  const fileURI /*:nsIFileURL*/ = (Services.io
    .newURI(href, null, null)
    .QueryInterface(Ci.nsIFileURL): any)
  const path = OS.Path.fromFileURI(fileURI)
  return `file://${path}`
}

const self /*:window*/ = this
self.FileSystem = class ExtensionAPI /*::<FileSystemSupervisor>*/ {
  getAPI(context) {
    return {
      FileSystem: {
        async mount(options /*:MountOptions*/) /*:Promise<Volume>*/ {
          const { url } = options
          if (url != null) {
            const root = normalizeFileURL(url)
            const access = accessFrom(options)
            const permission = `${root}?${access}`

            return {
              url: new URL(root),
              permission: options
            }
          } else {
            throw Error("Unable to mount")
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
