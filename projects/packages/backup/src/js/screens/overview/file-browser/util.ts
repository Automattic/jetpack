// Transform + formatting helpers ported from Calypso's
// `client/my-sites/backup/backup-contents-page/file-browser/util.ts`.
// `getFileExtension` is inlined (Calypso pulls it from a large media util).

import type {
	BackupLsResponse,
	BackupLsResponseContents,
	BackupPathInfoResponse,
	FileBrowserItem,
	FileBrowserItemInfo,
	FileType,
} from '../../../data/types';

const getFileExtension = ( filename: string ): string | null => {
	if ( ! filename ) {
		return null;
	}
	const lastDot = filename.lastIndexOf( '.' );
	if ( lastDot <= 0 || lastDot === filename.length - 1 ) {
		return null;
	}
	return filename.slice( lastDot + 1 ).toLowerCase();
};

const extensionToFileType: Record< string, FileType > = {
	jpg: 'image',
	jpeg: 'image',
	gif: 'image',
	ico: 'image',
	png: 'image',
	webp: 'image',
	svg: 'image',
	mp4: 'video',
	ogg: 'video',
	ogv: 'video',
	webm: 'video',
	avi: 'video',
	mp3: 'audio',
	aac: 'audio',
	pdf: 'text',
	md: 'text',
	txt: 'text',
	eot: 'fonts',
	woff: 'fonts',
	ttf: 'fonts',
	mo: 'translations',
	po: 'translations',
	pot: 'translations',
	html: 'code',
	php: 'code',
	css: 'code',
	js: 'code',
	scss: 'code',
	sass: 'code',
	less: 'code',
	crt: 'code',
};

export const getFileTypeByExtension = ( filename: string ): FileType | null => {
	const extension = getFileExtension( filename ) || '';
	return extensionToFileType[ extension ] || null;
};

export const transformFileType = (
	name: string,
	item: BackupLsResponseContents[ string ]
): FileType => {
	switch ( item.type ) {
		case 'dir':
		case 'wordpress':
		case 'theme':
		case 'plugin':
		case 'table':
		case 'archive':
			return item.type;
		case 'file':
			if ( item.has_children ) {
				return 'dir';
			}
			return getFileTypeByExtension( name ) ?? 'other';
		default:
			return 'other';
	}
};

export const parseBackupContentsData = ( payload: BackupLsResponse ): FileBrowserItem[] => {
	if ( ! payload || ! payload.contents || ! payload.ok ) {
		return [];
	}

	const transformedData = Object.entries( payload.contents ).map( ( [ name, item ] ) => {
		const type = transformFileType( name, item );
		const label = item.label ?? name;

		return {
			name: label,
			type,
			hasChildren: item.has_children ?? false,
			...( item.period && { period: item.period } ),
			...( item.sort && { sort: item.sort } ),
			...( item.type === 'archive' && { extensionType: name.replaceAll( '*', '' ) } ),
			...( item.type === 'table' && { rowCount: item.row_count } ),
			...( item.extension_version && { extensionVersion: item.extension_version } ),
			...( item.manifest_path && { manifestPath: item.manifest_path } ),
			...( item.id && { id: item.id } ),
			...( item.type !== 'wordpress' && { totalItems: item.total_items ?? 1 } ),
		};
	} );

	return transformedData.sort( ( a, b ) => {
		if ( a.sort !== undefined && b.sort !== undefined ) {
			return a.sort - b.sort;
		}
		if ( a.sort !== undefined ) {
			return -1;
		}
		if ( b.sort !== undefined ) {
			return 1;
		}
		if ( a.hasChildren === true && b.hasChildren !== true ) {
			return -1;
		}
		if ( b.hasChildren === true && a.hasChildren !== true ) {
			return 1;
		}
		if ( a.name < b.name ) {
			return -1;
		}
		if ( a.name > b.name ) {
			return 1;
		}
		return a.name.localeCompare( b.name );
	} );
};

export const parseBackupPathInfo = ( payload: BackupPathInfoResponse ): FileBrowserItemInfo => {
	if ( ! payload ) {
		return {};
	}

	const result: FileBrowserItemInfo = {};

	if ( payload.download_url !== undefined ) {
		result.downloadUrl = payload.download_url;
	}
	if ( payload.mtime !== undefined ) {
		result.mtime = payload.mtime;
	}
	if ( payload.size !== undefined ) {
		result.size = Number( payload.size );
	}
	if ( payload.hash !== undefined ) {
		result.hash = payload.hash;
	}
	if ( payload.data_type !== undefined ) {
		result.dataType = Number( payload.data_type );
	}
	if ( payload.manifest_filter !== undefined ) {
		result.manifestFilter = payload.manifest_filter;
	}

	return result;
};

export const convertBytes = (
	bytes: number,
	decimals = 1
): { unitAmount: string; unit: string } => {
	const units = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
	let size = bytes;
	let i = 0;
	while ( size >= 1024 && i < units.length - 1 ) {
		size /= 1024;
		i++;
	}
	return { unitAmount: size.toFixed( decimals ), unit: units[ i ] };
};

// UTF-8-safe base64 encoding — btoa alone can't handle multibyte chars.
export const encodeToBase64 = ( text: string ): string => {
	const encoder = new TextEncoder();
	const charCodes = encoder.encode( text );
	return window.btoa( String.fromCharCode( ...charCodes ) );
};

export { getFileExtension };
