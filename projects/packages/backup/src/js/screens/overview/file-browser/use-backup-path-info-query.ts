/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { backupPathInfoQuery } from '../../../data/query-options';
import { parseBackupPathInfo } from './util';
import type { FileBrowserItemInfo } from '../../../data/types';

/**
 *
 * @param rewindId
 * @param manifestPath
 * @param extensionType
 */
export function useBackupPathInfoQuery(
	rewindId: string,
	manifestPath: string,
	extensionType: string = ''
) {
	return useQuery( {
		...backupPathInfoQuery( rewindId, manifestPath, extensionType ),
		enabled: !! rewindId && !! manifestPath,
		select: ( data ): FileBrowserItemInfo => parseBackupPathInfo( data ),
	} );
}
