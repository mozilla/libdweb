// @flow

/*::
import { Cu, Cr } from "gecko"
import { ExtensionAPI, BaseContext } from "gecko"
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
*/

const { ExtensionUtils } = Cu.import(
  "resource://gre/modules/ExtensionUtils.jsm",
  {}
)

{
  const self /*:window*/ = this
  self.FileSystem = class extends ExtensionAPI /*::<{FileSystem:FileSystemManager}>*/ {
    getAPI(context) {
      const notImplemented = new ExtensionUtils.ExtensionError(
        "Not implemented yet"
      )

      class Mount /*::implements FileSystem*/ {
        /*::
      +url: string
      +readable: boolean
      +writable: boolean
      +watchable: boolean
      */

        constructor(volume /*:Volume*/) {
          this.url = volume.url
          this.readable = volume.readable
          this.writable = volume.writable
          this.watchable = volume.watchable
        }
        async open(
          path /*: Path*/,
          mode /*: Mode*/,
          options /*:?OpenOptions*/
        ) {
          throw notImplemented
        }
        async createUnique(Path, options) {
          throw notImplemented
        }
        async copy(
          from /*: Path*/,
          to /*: Path*/,
          options /*:?{ overwrite?: boolean }*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }
        async exists(path /*:Path*/) /*: Promise<boolean>*/ {
          throw notImplemented
        }
        async createDirectory(
          path /*:Path*/,
          options /*: DirOptions*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }
        async move(
          from /*: Path*/,
          to /*: Path*/,
          options /*:?{ overwrite?: boolean, noCopy?: boolean }*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }
        async read(
          Path /*:Path*/,
          options /*:? ReadOptions*/
        ) /*: Promise<ArrayBuffer>*/ {
          throw notImplemented
        }
        async removeFile(
          path /*:Path*/,
          options /*:? { ignoreAbsent?: boolean }*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }
        async removeDirectory(
          path /*:Path*/,
          options /*:? {
        ignoreAbsent?: boolean,
        recursive?: boolean,
        ignorePermissions?: boolean
      }*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }
        async setDates(path /*:Path*/, dates /*:Dates*/) /*: Promise<void>*/ {
          throw notImplemented
        }
        async setPermissions(
          path /*:Path*/,
          permissons /*:Permissions*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }

        async stat(path /*:Path*/) /*: Promise<Stat>*/ {
          throw notImplemented
        }
        async unixSymLink(
          target /*: Path*/,
          link /*: Path*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }

        async writeAtomic(
          path /*:Path*/,
          content /*:ArrayBuffer*/,
          options /*:?{
          tmpPath?: Path,
          noOverwrite?: boolean,
          flush?: boolean,
          backupTo?: Path
        }*/
        ) /*: Promise<void>*/ {
          throw notImplemented
        }

        async directoryEntries(
          path /*:Path*/,
          options /*:?{ winPattern?: string, batch?: number }*/
        ) /*: Promise<AsyncIterator<Entry>>*/ {
          throw notImplemented
        }

        async watch(
          path /*:Path*/,
          options /*:?{ recursive?: true }*/
        ) /*: Promise<AsyncIterator<Path>>*/ {
          throw notImplemented
        }
      }

      return {
        FileSystem: {
          async mount(options /*:MountOptions*/) {
            const volume /*: Volume*/ = await context.childManager.callParentAsyncFunction(
              "FileSystem.mount",
              [options]
            )

            return Cu.cloneInto(new Mount(volume), context.cloneScope, {
              cloneFunctions: true
            })
          }
        }
      }
    }
  }
}
