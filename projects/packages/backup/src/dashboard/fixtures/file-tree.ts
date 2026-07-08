import { isFolder } from '../types/file-tree';
import type { FileNode } from '../types/file-tree';

// Stable timestamps + hashes so snapshot tests can't flake on
// import-time clock reads. The exact values mirror the kind of
// metadata the future REST path-info call will return.
const FIXTURE_LAST_MODIFIED = '2026-02-16T20:42:00.000Z';

const file = (
	name: string,
	path: string,
	sizeBytes: number,
	mimeType: string,
	hash = 'ce4fc8526a348484a88bba63b08c0976'
): FileNode => ( {
	type: 'file',
	name,
	path,
	sizeBytes,
	mimeType,
	lastModified: FIXTURE_LAST_MODIFIED,
	hash,
} );

const folder = ( name: string, path: string, children?: FileNode[] ): FileNode => ( {
	type: 'folder',
	name,
	path,
	children,
} );

export const MOCK_FILE_TREE: FileNode[] = [
	folder( 'wp-content', '/wp-content', [
		folder( 'themes', '/wp-content/themes', [
			folder( 'twentytwentyfive', '/wp-content/themes/twentytwentyfive', [
				file( 'style.css', '/wp-content/themes/twentytwentyfive/style.css', 4_812, 'text/css' ),
			] ),
		] ),
		folder( 'plugins', '/wp-content/plugins', [
			folder( 'jetpack', '/wp-content/plugins/jetpack', [
				file(
					'jetpack.php',
					'/wp-content/plugins/jetpack/jetpack.php',
					12_034,
					'application/x-php'
				),
			] ),
		] ),
		folder( 'uploads', '/wp-content/uploads', [
			file( 'cat.png', '/wp-content/uploads/cat.png', 188_240, 'image/png' ),
		] ),
	] ),
	folder( 'sql', '/sql', [
		file( 'database.sql', '/sql/database.sql', 2_485_120, 'application/sql' ),
	] ),
	file( 'wp-config.php', '/wp-config.php', 3_312, 'application/x-php' ),
];

/**
 * Recursively searches `MOCK_FILE_TREE` for a node at the given path.
 *
 * @param path - Absolute path under the backup (e.g. `'/wp-content/uploads'`).
 * @return The matching node, or null when no node is found.
 */
export function findNodeByPath( path: string ): FileNode | null {
	const walk = ( nodes: FileNode[] ): FileNode | null => {
		for ( const node of nodes ) {
			if ( node.path === path ) {
				return node;
			}
			if ( isFolder( node ) && node.children ) {
				const found = walk( node.children );
				if ( found ) {
					return found;
				}
			}
		}
		return null;
	};
	return walk( MOCK_FILE_TREE );
}
