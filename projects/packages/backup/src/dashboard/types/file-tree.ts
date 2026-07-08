export type FileNodeBase = {
	name: string;
	path: string;
};

export type FolderNode = FileNodeBase & {
	type: 'folder';
	children?: FileNode[];
};

export type FileNodeFile = FileNodeBase & {
	type: 'file';
	sizeBytes: number;
	mimeType: string;
	lastModified: string;
	hash: string;
};

export type FileNode = FolderNode | FileNodeFile;

export const isFolder = ( node: FileNode ): node is FolderNode => node.type === 'folder';
