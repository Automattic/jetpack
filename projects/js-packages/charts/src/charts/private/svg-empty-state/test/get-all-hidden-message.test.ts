import { getAllHiddenMessage } from '../get-all-hidden-message';

describe( 'getAllHiddenMessage', () => {
	it.each( [
		[ false, 'series', 'All series are hidden.' ],
		[ true, 'series', 'All series are hidden. Click legend items to show data.' ],
		[ false, 'segments', 'All segments are hidden.' ],
		[ true, 'segments', 'All segments are hidden. Click legend items to show data.' ],
	] as const )(
		'returns the expected message for interactive=%s %s',
		( interactive, type, message ) => {
			expect( getAllHiddenMessage( interactive, type ) ).toBe( message );
		}
	);
} );
