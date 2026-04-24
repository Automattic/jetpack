/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { backupLsQuery } from '../../../data/query-options';
import { parseBackupContentsData } from './util';
import type { FileBrowserItem } from '../../../data/types';

// `enabled` defaults to false — Calypso's pattern is that a node only
// fetches its children after first expansion. The root passes true.
/**
 *
 * @param rewindId
 * @param path
 * @param enabled
 */
export function useBackupContentsQuery( rewindId: string, path: string, enabled: boolean = false ) {
	return useQuery( {
		...backupLsQuery( rewindId, path ),
		enabled,
		select: ( data ): FileBrowserItem[] => parseBackupContentsData( data ),
	} );
}
