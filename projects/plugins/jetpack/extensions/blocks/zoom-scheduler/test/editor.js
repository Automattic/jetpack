jest.mock( '../../../shared/register-jetpack-block', () => ( {
	registerJetpackBlockFromMetadata: jest.fn(),
} ) );

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( { name, attributes } ) ),
} ) );

jest.mock( '../edit', () => jest.fn() );
jest.mock( '../save', () => jest.fn() );

describe( 'Zoom Scheduler editor transforms', () => {
	let registerJetpackBlockFromMetadata;

	const getRawTransform = () => {
		jest.resetModules();

		registerJetpackBlockFromMetadata =
			require( '../../../shared/register-jetpack-block' ).registerJetpackBlockFromMetadata;
		registerJetpackBlockFromMetadata.mockClear();

		jest.isolateModules( () => {
			require( '../editor' );
		} );

		return registerJetpackBlockFromMetadata.mock.calls[ 0 ][ 1 ].transforms.from[ 0 ];
	};

	test( 'matches only valid Zoom Scheduler booking page URLs', () => {
		const rawTransform = getRawTransform();

		expect(
			rawTransform.isMatch( {
				nodeName: 'P',
				textContent: 'https://scheduler.zoom.us/test-user/discovery-call',
			} )
		).toBe( true );

		expect(
			rawTransform.isMatch( {
				nodeName: 'P',
				textContent: 'https://scheduler.zoom.us/?month=2026-07',
			} )
		).toBe( false );
	} );

	test( 'creates a Zoom Scheduler block with a normalized URL', () => {
		const rawTransform = getRawTransform();
		const block = rawTransform.transform( {
			nodeName: 'P',
			textContent: 'scheduler.zoom.us/test-user/discovery-call?month=2026-07',
		} );

		expect( block.name ).toBe( 'jetpack/zoom-scheduler' );
		expect( block.attributes.url ).toBe(
			'https://scheduler.zoom.us/test-user/discovery-call?month=2026-07'
		);
	} );

	test( 'falls back to a paragraph if an invalid URL reaches the transform', () => {
		const rawTransform = getRawTransform();
		const block = rawTransform.transform( {
			nodeName: 'P',
			textContent: 'https://scheduler.zoom.us/?month=2026-07',
		} );

		expect( block.name ).toBe( 'core/paragraph' );
		expect( block.attributes.content ).toBe( 'https://scheduler.zoom.us/?month=2026-07' );
	} );
} );
