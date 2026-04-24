/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useQuery } from '@tanstack/react-query';
import { backupLsQuery } from '../../../data/query-options';
import { parseBackupContentsData } from './util';
import type { BackupLsResponse, FileBrowserItem } from '../../../data/types';

// Module-scope `select` so TanStack Query can memoize its result.
// Inline arrow functions create a new reference every render, which
// makes TanStack re-run select and return a fresh array each time —
// that cascades into FileBrowserNode re-renders for every node in the
// tree on every render.
const selectContents = ( data: BackupLsResponse ): FileBrowserItem[] =>
	parseBackupContentsData( data );

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
		select: selectContents,
	} );
}
