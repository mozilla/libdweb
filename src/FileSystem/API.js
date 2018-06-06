// @flow

export interface FileSystemManager {
  // Will bring up a OS native file picker and allow user to select directory.
  // If user chose to grant access to specific directory promise will resolve
  // to the `FileSystem` instance for that directory. If user already granted
  // access to the directory with a matching name and permissions promise
  // resolves without prompting a user.

  // This API will be limited to options_ui only so that user has a clear idea
  // what is requesting filesystem access.
  mount(MountOptions): Promise<FileSystem>;
}

export interface MountOptions {
  url?: string;
  read?: false;
  write?: true;
  watch?: true;
}

export interface Volume {
  +url: string;
  +readable: boolean;
  +writable: boolean;
  +watchable: boolean;
}

export type Path = string

export interface FileSystem extends Volume {
  open(Path, ReadMode, options: ?OpenOptions): ReadableFile;
  open(Path, WriteMode, options: ?OpenOptions): WritableFile;
  open(Path, ReadWriteMode, options: ?OpenOptions): DuplexFile;

  createUnique(Path, options: ?CreateUnique): WritableFile;
  createUnique(Path, options: ?CreateUnique): DuplexFile;

  copy(from: Path, to: Path, options?: { overwrite?: boolean }): Promise<void>;
  exists(Path): Promise<boolean>;
  createDirectory(Path, options: DirOptions): Promise<void>;
  move(
    from: Path,
    to: Path,
    options?: { overwrite?: boolean, noCopy?: boolean }
  ): Promise<void>;

  read(Path, options?: ReadOptions): Promise<ArrayBuffer>;
  removeFile(Path, options?: { ignoreAbsent?: boolean }): Promise<void>;
  removeDirectory(
    Path,
    options?: {
      ignoreAbsent?: boolean,
      recursive?: boolean,
      ignorePermissions?: boolean
    }
  ): Promise<void>;
  setDates(Path, Dates): Promise<void>;
  setPermissions(Path, Permissions): Promise<void>;

  stat(Path): Promise<Stat>;
  unixSymLink(target: Path, link: Path): Promise<void>;

  writeAtomic(
    Path,
    ArrayBuffer,
    options?: {
      tmpPath?: Path,
      noOverwrite?: boolean,
      flush?: boolean,
      backupTo?: Path
    }
  ): Promise<void>;

  directoryEntries(
    Path,
    { winPattern?: string, batch?: number }
  ): Promise<AsyncIterator<Entry>>;

  // Note: Notifications will be dropped if consumer isn't actively consuming
  // them. For example in notifaction loop if consumer awaits on some other
  // async operation notifications that occurs while loop is awating will be
  // dropped. In other words don't await from with-in the `for await` body
  // if you do still need to wait on async operation and also can't drop
  // notification you should consider buffering strategy.
  watch(Path, options?: { recursive?: true }): Promise<AsyncIterator<Path>>;
}

export type WriteFlags =
  | { truncate: true, existing?: boolean }
  | { create: true }
  | { append?: boolean }

export type ReadMode = { read: true, write?: false }
export type WriteMode = { write: true, read?: false } & WriteFlags
export type ReadWriteMode = { read: true, write: true } & WriteFlags
export type Mode = ReadMode | WriteMode | ReadWriteMode

export interface OpenOptions {
  unixFlags?: UnixAccessRights;
  unixMode?: UnixOpeningMode;
  winShare?: WinSharePolicy;
  winSecurity?: WinSecurityPolicy;
  winAccess?: WinAccessRights;
  winDisposition?: WinDispositionMode;
}

export interface DirOptions {
  from?: Path;
  ignoreExisting?: boolean;
  unixMode?: UnixOpeningMode;
  winSecurity?: WinSecurityPolicy;
}

export interface CreateUnique {
  humanReadable?: boolean;
  maxAttempts?: number;
}

export opaque type UnixAccessRights: number = number
export opaque type UnixOpeningMode: number = number
export opaque type WinSharePolicy: number = number
export opaque type WinSecurityPolicy: number = number
export opaque type WinAccessRights: number = number
export opaque type WinDispositionMode: number = number

export interface GeneralFile {
  close(): Promise<void>;
  flush(): Promise<void>;
  byteOffset(): Promise<number>;
  stat(): Promise<Stat>;
  setDates(Dates): Promise<void>;
  setByteOffset(number, origin?: OffsetOrigin): Promise<void>;
  setPermissions(Permissions): Promise<void>;
}

export type Permissions = {
  winAttributes?: {
    hidden?: boolean,
    readOnly?: boolean,
    system?: boolean
  },
  unixMode?: UnixAccessRights,
  unixHonorUmask: boolean
}

export type Dates =
  | AccessDate
  | ModificationDate
  | (AccessDate & ModificationDate)

type AccessDate = {
  access: number | Date
}

type ModificationDate = {
  modification: number | Date
}

export interface Writable {
  write(ArrayBuffer, options: ?WriteOptions): Promise<number>;
}

export interface Readable {
  read(options: ?ReadOptions): Promise<ArrayBuffer>;
}

export opaque type OffsetOrigin: number = number

export interface FilePosition {
  POS_CURRENT: OffsetOrigin;
  POS_END: OffsetOrigin;
  POS_START: OffsetOrigin;
}

export interface ReadableFile extends GeneralFile, Readable {
  readable: true;
  writable: false;
}

export interface WritableFile extends GeneralFile, Writable {
  writable: true;
  readable: false;
}

export interface DuplexFile extends GeneralFile, Readable, Writable {
  writable: true;
  readable: true;
}

export type File = ReadableFile | WritableFile | DuplexFile

export interface ReadOptions {
  size?: number;
  offset?: number;
}

export interface WriteOptions {
  size?: number;
  offset?: number;
}

export type Stat = WindowsStat | UnixStat

interface GeneralStat {
  +isDir: boolean;
  +isSymLink: boolean;
  +size: number;
  +lastAccessDate: number;
  +lastModificationDate: number;
}

export interface UnixStat extends GeneralStat {
  +unixOwner: number;
  +unixGroup: number;
  +unixMode: number;
  +unixLastStatusChangeDate: number;
}

export interface WindowsStat extends GeneralStat {
  winBirthDate: number;
  winAttributes: {
    hidden: boolean,
    readOnly: boolean,
    system: boolean
  };
}

export interface GeneralEntry {
  +isDir: boolean;
  +isSymLink: boolean;
  +name: string;
  +path: Path;
}

export interface WindowsEntry extends GeneralEntry {
  +winLastAccessDate: number;
  +winCreationDate: number;
  +winLastWriteDate: number;
}

export interface UnixEntry extends GeneralEntry {}

export type Entry = UnixEntry | WindowsEntry
