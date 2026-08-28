export type FileNodeBase = {
	name: string;
	path: string;
	// The opaque per-entry `id` from `/rewind/backup/ls` — base64 of the
	// volume-prefixed manifest path (`ZjY6L2luZGV4LnBocA==` decodes to
	// `f6:/index.php`). It is what a granular download names its entries
	// by; the display `path` above is not a value upstream accepts.
	//
	// Optional because the ls entry declares it optional, and an entry
	// that arrives without one cannot be named in a download request.
	id?: string;
};

export type FolderNode = FileNodeBase & {
	type: 'folder';
	children?: FileNode[];
};

export type FileNodeFile = FileNodeBase & {
	type: 'file';
	// `/rewind/backup/ls` returns a `period` Unix-seconds timestamp per
	// entry — the timestamp when this file itself last changed. The
	// hook converts it to an ISO string for display here.
	lastModified?: string;
	// The same `period` value in its raw Unix-seconds form. Used by the
	// file-content preview as the `{period}` URL segment when streaming
	// from VaultPress — content is stored against the file's own period,
	// not the parent backup's rewindId.
	period?: string;
	// The volume-prefixed path WPCOM uses to identify this file
	// (e.g. "f5:/wp-config.php"). Required for the file-content preview
	// call. The display path on `FileNodeBase` strips this prefix.
	manifestPath?: string;
};

export type FileNode = FolderNode | FileNodeFile;

export const isFolder = ( node: FileNode ): node is FolderNode => node.type === 'folder';
