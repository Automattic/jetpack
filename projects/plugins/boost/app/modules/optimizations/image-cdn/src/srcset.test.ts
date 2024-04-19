import {
	calculateTargetSize,
	dynamicSrcset,
	findClosestImageSize,
	getImageSizeFromUrl,
	isSizeReusable,
	parseImageSize,
} from './srcset';



function createImageSize( resize: string, mq: string, prevSize?: string ) {
	const url = new URL( 'https://i0.wp.com/example.com/image.jpg' );
	url.searchParams.set( 'resize', resize );
	if ( prevSize ) {
		url.searchParams.set( 'jb-lazy', prevSize );
	}
	return `${ url } ${ mq }`;
}

function setBoundingRect( img: HTMLImageElement, width: number, height: number ) {
	Object.defineProperty( img, 'getBoundingClientRect', {
		value: () => ( {
			width,
			height,
			top: 0,
			right: width,
			bottom: height,
			left: 0,
		} ),
		writable: true,
	} );
}

describe( 'parse image resize param', () => {
	it( 'should parse valid resize param', () => {
		expect( parseImageSize( '100,200' ) ).toEqual( { width: 100, height: 200 } );
	} );

	it( 'should return null for invalid resize param', () => {
		expect( parseImageSize( 'invalid' ) ).toBeNull();
	} );
} );

describe( 'getImageSizeFromUrl', () => {
	it( 'should extract image size from URL', () => {
		const url = 'https://i0.wp.com/example.com/image.jpg?resize=100,200';
		expect( getImageSizeFromUrl( url ) ).toEqual( { width: 100, height: 200 } );
	} );

	it( 'should return null if resize param is missing', () => {
		const url = 'https://i0.wp.com/example.com/image.jpg';
		expect( getImageSizeFromUrl( url ) ).toBeNull();
	} );
} );

describe( 'calculateTargetSize', () => {
	it( 'should calculate target size based on bounding rect and dpr', () => {
		const rect: DOMRect = {
			width: 500,
			height: 250,
			x: 0,
			y: 0,
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			toJSON: () => ( {} ),
		};
		window.devicePixelRatio = 2;
		expect( calculateTargetSize( rect ) ).toEqual( { width: 1000, height: 500 } );
	} );
} );

describe('isSizeReusable', () => {
	it('should return true if the target width is close to the width', () => {
		expect(isSizeReusable(100, 100)).toBe(true);
		expect(isSizeReusable(90, 100)).toBe(true);
		expect(isSizeReusable(51, 100)).toBe(true);
		expect(isSizeReusable(50, 100)).toBe(false);
		expect(isSizeReusable(101, 100)).toBe(false);
		expect(isSizeReusable(150, 100)).toBe(false);
	})
})

describe( 'findClosestImageSize', () => {
	const srcset = [
		createImageSize( '100,50', '100w' ),
		createImageSize( '400,250', '400w' ),
		createImageSize( '1400,700', '1400w' ),
	];

	it( 'should return undefined if the urls are invalid', () => {
		expect( findClosestImageSize( [ 'foo.com', 'bar.com' ], 500 ) ).toBeUndefined();
	} );

	it( "should find the closest image that's larger than the target width", () => {
		expect( findClosestImageSize( srcset, 51 ) ).toEqual( {
			url: srcset[0].split(' ')[0],
			width: 100,
			height: 50,
		} );

		expect( findClosestImageSize( srcset, 1380 ) ).toEqual( {
			url: srcset[2].split(' ')[0],
			width: 1400,
			height: 700,
		} );
	} );

	it("shouldn't find closest image if the closest image isn't close enough in size", () => {
		expect( findClosestImageSize( srcset, 50 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 110 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 1100 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 1350 ) ).toBeUndefined();
	})
} );



describe( 'dynamicSrcset', () => {
	let img: HTMLImageElement;
	beforeEach( () => {
		window.devicePixelRatio = 1;
		window.innerWidth = 5000;
		img = document.createElement( 'img' );
		img.src = 'https://i0.wp.com/example.com/image.jpg';
		const srcset = [
			createImageSize( '100,50', '100w' ),
			createImageSize( '400,250', '400w' ),
			createImageSize( '1400,700', '1400w' ),
		];

		img.srcset = srcset.join( ',' );
		img.setAttribute( 'width', '1000' );
		img.setAttribute( 'height', '500' );

		// Mocking the bounding rect of the image
		setBoundingRect( img, 1000, 500 );
	} );

	it( 'srcset should include all original image sizes', () => {
		dynamicSrcset( img );
		expect( img.srcset ).toContain( createImageSize( '100,50', '100w' ) );
		expect( img.srcset ).toContain( createImageSize( '400,250', '400w' ) );
		expect( img.srcset ).toContain( createImageSize( '1400,700', '1400w' ) );
	} );

	it( 'should create a new srcset entry for the target size', () => {
		dynamicSrcset( img );
		expect( img.srcset ).toContain( createImageSize( '1000,500', '5000w' ) );
	} );

	it( 'should reuse existing srcset entry if the target size is close enough', () => {
		setBoundingRect( img, 396, 248 );
		dynamicSrcset( img );
		expect( img.srcset ).toContain(
			createImageSize( '400,250', `${ window.innerWidth * window.devicePixelRatio }w` )
		);
	} );

	it( "shouldn't upscale the image when reusing an srcset entry", () => {
		setBoundingRect( img, 420, 260 );
		dynamicSrcset( img );
		expect( img.srcset ).toContain(
			createImageSize( '420,260', `${ window.innerWidth * window.devicePixelRatio }w` )
		);
	} );



	it( 'should not update attributes if conditions are not met', () => {
		const image = document.createElement( 'img' );
		image.src = 'https://i0.wp.com/example.com/image.jpg';

		dynamicSrcset( image );

		expect( image.srcset ).toBe( '' );
		expect( image.sizes ).toBe( '' );
	} );
} );
