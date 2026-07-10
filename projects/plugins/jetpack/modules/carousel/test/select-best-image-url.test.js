import { selectBestImageUrl } from '../select-best-image-url';

/**
 * Set a fake devicePixelRatio for a test, restoring the original afterwards.
 *
 * @param {number} value - The devicePixelRatio to emulate.
 * @return {Function} A cleanup function restoring the original value.
 */
function withDevicePixelRatio( value ) {
	const original = Object.getOwnPropertyDescriptor( window, 'devicePixelRatio' );
	Object.defineProperty( window, 'devicePixelRatio', { value, configurable: true } );
	return () => {
		if ( original ) {
			Object.defineProperty( window, 'devicePixelRatio', original );
		} else {
			delete window.devicePixelRatio;
		}
	};
}

describe( 'selectBestImageUrl', () => {
	const origFile = 'https://example.com/wp-content/uploads/2026/06/photo.jpg';

	it( 'returns an empty string when no origFile is provided', () => {
		expect( selectBestImageUrl( {} ) ).toBe( '' );
	} );

	it( 'returns the original file when width/viewport data is missing', () => {
		expect( selectBestImageUrl( { origFile } ) ).toBe( origFile );
	} );

	it( 'returns the original file when largeFile is undefined', () => {
		expect(
			selectBestImageUrl( { origFile, origWidth: 1334, origHeight: 2000, maxWidth: 390 } )
		).toBe( origFile );
	} );

	// Regression test: portrait mobile carousel showing a black screen.
	// Gallery images that were never enriched with a data-large-file attribute reach
	// selectBestImageUrl with largeFile === '' (a missing attribute reads as empty string).
	// In a narrow viewport (origWidth >= maxWidth * devicePixelRatio) the code used to
	// return that empty largeFile, leaving the carousel slide with an empty src and a black
	// screen. It must fall back to the original file instead.
	it( 'returns the original file when largeFile is an empty string in a narrow (portrait) viewport', () => {
		const restore = withDevicePixelRatio( 3 );
		try {
			expect(
				selectBestImageUrl( {
					origFile,
					origWidth: 1334,
					origHeight: 2000,
					maxWidth: 390, // portrait phone width; * DPR 3 = 1170 < 1334
					maxHeight: 780,
					largeFile: '',
				} )
			).toBe( origFile );
		} finally {
			restore();
		}
	} );

	it( 'returns the original file when largeFile is an empty string in a wide (landscape) viewport', () => {
		const restore = withDevicePixelRatio( 3 );
		try {
			expect(
				selectBestImageUrl( {
					origFile,
					origWidth: 1334,
					origHeight: 2000,
					maxWidth: 844, // landscape width; * DPR 3 = 2532 > 1334
					maxHeight: 326,
					largeFile: '',
				} )
			).toBe( origFile );
		} finally {
			restore();
		}
	} );

	it( 'returns the large file when it is big enough for the viewport', () => {
		const restore = withDevicePixelRatio( 1 );
		const largeFile = 'https://example.com/wp-content/uploads/2026/06/photo-1024x1536.jpg';
		try {
			expect(
				selectBestImageUrl( {
					origFile,
					origWidth: 2000,
					origHeight: 3000,
					maxWidth: 390,
					maxHeight: 780,
					largeFile,
				} )
			).toBe( largeFile );
		} finally {
			restore();
		}
	} );
} );
