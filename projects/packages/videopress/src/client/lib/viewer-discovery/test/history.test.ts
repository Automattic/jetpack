import { progressPercent, resumeUrl, shelfItems } from '../history';
import type { HistoryItem } from '../history';

const item = ( guid: string, status: HistoryItem[ 'status' ], positionMs = 0 ): HistoryItem => ( {
	guid,
	status,
	positionMs,
	durationMs: 100000,
	watchedMs: positionMs,
	generation: 0,
} );

describe( 'viewer discovery history helpers', () => {
	it( 'shows only unfinished videos in Continue watching, any in Recently watched', () => {
		const items = [
			item( 'a', 'watched' ),
			item( 'b', 'in_progress', 40000 ),
			item( 'c', 'none' ),
		];
		expect( shelfItems( items, 'continue', 8 ).map( i => i.guid ) ).toEqual( [ 'b' ] );
		expect( shelfItems( items, 'recent', 8 ).map( i => i.guid ) ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'resumes in-progress videos at their position', () => {
		const url = resumeUrl(
			'https://example.com/videopress?v=__GUID__',
			't',
			item( 'abcd1234', 'in_progress', 72500 )
		);
		expect( url ).toBe( 'https://example.com/videopress?v=abcd1234&t=72' );
		expect( progressPercent( item( 'x', 'in_progress', 25000 ) ) ).toBe( 25 );
		expect( progressPercent( item( 'x', 'watched', 1000 ) ) ).toBe( 100 );
	} );
} );
