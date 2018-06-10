// @flow strict

export type url = string
export opaque type WritableFile = {}
export opaque type ReadableFile = {}
export opaque type DuplexFile = {}

export interface FileSystemManager {
  // Will bring up a OS native file picker and allow user to select directory.
  // If user chose to grant access to specific directory promise will resolve
  // to the `FileSystem` instance for that directory. If user already granted
  // access to the directory with a matching name and permissions promise
  // resolves without prompting a user.

  // This API will be limited to options_ui only so that user has a clear idea
  // what is requesting filesystem access.
  mount(MountOptions): Promise<Volume>;

  open(url, ReadMode, options: ?OpenOptions): ReadableFile;
  open(url, WriteMode, options: ?OpenOptions): WritableFile;
  open(url, ReadWriteMode, options: ?OpenOptions): DuplexFile;

  readFile(url, options?: ReadOptions): Promise<ArrayBuffer>;
  writeFile(url, ArrayBuffer, options?: WriteOptions): Promise<number>;
  removeFile(url, options?: RemoveFileOptions): Promise<void>;

  setDates(url, Dates): Promise<void>;
  setPermissions(url, Permissions): Promise<void>;
  stat(url): Promise<Stat>;
  copy(from: url, to: url, options?: CopyOptions): Promise<void>;
  move(from: url, to: url, options?: MoveOptions): Promise<void>;
  createSymbolicLink(from: url, to: url): Promise<void>;
  exists(url): Promise<boolean>;
  watch(url, options?: WatchOptions): Promise<AsyncIterator<url>>;

  createDirectory(url, options?: CreateDirOptions): Promise<void>;
  removeDirectory(url, options?: RemoveDirOptions): Promise<void>;
  readDirectory(url, options?: ReadDirOptions): Promise<Entry[]>;
}

export interface FileManager {
  close(File): Promise<void>;
  flush(File): Promise<void>;
  getPosition(File): Promise<number>;
  stat(File): Promise<Stat>;

  setDates(File, Dates): Promise<void>;

  read(Readable, options?: ReadOptions): Promise<ArrayBuffer>;
  write(Writable, ArrayBuffer, options?: WriteOptions): Promise<number>;
}

export type RemoveFileOptions = {
  ignoreAbsent?: boolean
}

export type RemoveDirOptions = {
  ignoreAbsent?: boolean,
  recursive?: boolean,
  ignorePermissions?: boolean
}
export type CopyOptions = { noOverwrite?: boolean }
export type MoveOptions = { noOverwrite?: boolean, noCopy?: boolean }
export type WatchOptions = { recursive?: true }
export type ReadDirOptions = { winPattern?: string, batch?: number }

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

export interface CreateDirOptions {
  from?: url;
  ignoreExisting?: boolean;
  unixMode?: UnixOpeningMode;
  winSecurity?: WinSecurityPolicy;
}

export type UnixAccessRights = number
export type UnixOpeningMode = number
export type WinSharePolicy = number
export type WinSecurityPolicy = number
export opaque type WinAccessRights: number = number
export opaque type WinDispositionMode: number = number

export type Permissions = {
  winAttributes?: {
    hidden?: boolean,
    readOnly?: boolean,
    system?: boolean
  },
  unixMode?: UnixAccessRights,
  unixHonorUmask?: boolean
}

export type Dates =
  | AccessDate
  | ModificationDate
  | (AccessDate & ModificationDate)

export type AccessDate = {
  access: number | Date
}

export type ModificationDate = {
  modification: number | Date
}

export type Readable = ReadableFile | DuplexFile
export type Writable = WritableFile | DuplexFile
export type File = ReadableFile | WritableFile | DuplexFile

export opaque type OffsetOrigin: number = number

export interface FilePosition {
  POS_CURRENT: OffsetOrigin;
  POS_END: OffsetOrigin;
  POS_START: OffsetOrigin;
}

export interface ReadOptions {
  size?: number;
  position?: number;
}

export interface WriteOptions {
  size?: number;
  position?: number;
}

export interface Stat {
  +isDir: boolean;
  +isSymLink: boolean;
  +size: number;
  +lastAccessDate: number;
  +lastModificationDate: number;

  +unixOwner?: number;
  +unixGroup?: number;
  +unixMode?: number;
  +unixLastStatusChangeDate?: number;
  +winBirthDate?: number;
  +winAttributes?: {
    hidden: boolean,
    readOnly: boolean,
    system: boolean
  };
}

export interface Entry {
  +isDir: boolean;
  +isSymLink: boolean;
  +name: string;
  +url: url;

  +winLastAccessDate?: number;
  +winCreationDate?: number;
  +winLastWriteDate?: number;
}
