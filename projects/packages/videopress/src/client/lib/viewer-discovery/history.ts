export type HistoryItem = {
	guid: string;
	status: 'watched' | 'in_progress' | 'legacy_seen' | 'none';
	positionMs: number;
	durationMs: number;
	watchedMs: number;
	generation: number;
	title?: string;
};

/**
 * How far into a video the viewer is, for a progress bar.
 *
 * @param item - History item.
 * @return Percentage from 0 to 100; 100 when watched.
 */
export function progressPercent( item: HistoryItem ): number {
	if ( item.status === 'watched' ) {
		return 100;
	}
	if ( item.durationMs <= 0 ) {
		return 0;
	}
	return Math.max( 0, Math.min( 100, Math.round( ( item.positionMs / item.durationMs ) * 100 ) ) );
}

/**
 * The items a shelf shows: started but unfinished for Continue watching, anything for Recently watched.
 *
 * @param items - History, most recent first.
 * @param show  - Shelf kind.
 * @param count - Most items.
 * @return Items to show.
 */
export function shelfItems( items: HistoryItem[], show: string, count: number ): HistoryItem[] {
	const wanted =
		show === 'recent'
			? items.filter( item => item.status !== 'none' )
			: items.filter( item => item.status === 'in_progress' );
	return wanted.slice( 0, count );
}

/**
 * The watch page URL that resumes an item.
 *
 * @param template - Video page URL with __GUID__.
 * @param startVar - Start-time query arg.
 * @param item     - History item.
 * @return URL.
 */
export function resumeUrl( template: string, startVar: string, item: HistoryItem ): string {
	const url = new URL( template.replace( '__GUID__', encodeURIComponent( item.guid ) ) );
	const seconds = Math.floor( item.positionMs / 1000 );
	if ( item.status === 'in_progress' && seconds > 0 ) {
		url.searchParams.set( startVar, String( seconds ) );
	}
	return url.toString();
}
