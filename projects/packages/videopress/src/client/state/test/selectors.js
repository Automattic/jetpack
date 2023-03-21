import { getProcessedAllVideosBeingRemoved } from '../selectors';

describe( 'getProcessedAllVideosBeingRemoved()', () => {
	it( 'should return true when videos finished being removed', () => {
		const state = {
			videos: {
				_meta: {
					processedAllVideosBeingRemoved: true,
				},
			},
		};
		const output = getProcessedAllVideosBeingRemoved( state );
		expect( output ).toBe( true );
	} );

	it( 'should return false when there is no indication of videos having been removed yet', () => {
		const state = {
			videos: {
				_meta: {},
			},
		};
		const output = getProcessedAllVideosBeingRemoved( state );
		// This would return undefined, which is falsy.
		expect( output ).toBeFalsy();
	} );
} );
