import {
	calculateTargetSize,
	dynamicSrcset,
	findClosestImageSize,
	getImageSizeFromUrl,
	isSizeReusable,
	parseImageSize,
} from './srcset';

function createImageSize( resize: string, mq: string ) {
	const url = new URL( 'https://i0.wp.com/example.com/image.jpg' );
	const [ width, height ] = resize.split( ',' ).map( item => parseInt( item, 10 ) );
	const size = calculateTargetSize( { width, height } );
	url.searchParams.set( 'resize', `${ size.width },${ size.height }` );
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

	it( 'should round up the target size to the nearest 10', () => {
		const ratio = 600 / 200;
		const rect: DOMRect = {
			width: 600 - 9,
			height: ( 600 - 9 ) / ratio, // = 197px
			x: 0,
			y: 0,
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			toJSON: () => ( {} ),
		};
		window.devicePixelRatio = 1;
		expect( calculateTargetSize( rect ) ).toEqual( {
			width: 600,
			height: Math.ceil( 600 / ratio ),
		} );

		window.devicePixelRatio = 2;
		expect( calculateTargetSize( rect ) ).toEqual( {
			width: 1190,
			height: Math.ceil( 1190 / ratio ),
		} );
	} );
} );

describe( 'isSizeReusable', () => {
	it( 'should return true if the target width is close to the width', () => {
		expect( isSizeReusable( 100, 100 ) ).toBe( true );
		expect( isSizeReusable( 90, 100 ) ).toBe( true );
		expect( isSizeReusable( 51, 100 ) ).toBe( true );
		expect( isSizeReusable( 901, 1000 ) ).toBe( true );
		expect( isSizeReusable( 50, 100 ) ).toBe( false );
		expect( isSizeReusable( 101, 100 ) ).toBe( false );
		expect( isSizeReusable( 150, 100 ) ).toBe( false );
		expect( isSizeReusable( 900, 1000 ) ).toBe( false );
	} );
} );

describe( 'findClosestImageSize', () => {
	beforeEach( () => {
		window.devicePixelRatio = 1;
	} );

	const srcset = [
		createImageSize( '100,50', '200w' ),
		createImageSize( '400,250', '800w' ),
		createImageSize( '1400,700', '2400w' ),
	];

	it( 'should return undefined if the urls are invalid', () => {
		expect( findClosestImageSize( [ 'foo.com', 'bar.com' ], 500 ) ).toBeUndefined();
	} );

	it( "should find the closest image that's larger than the target width", () => {
		expect( findClosestImageSize( srcset, 51 ) ).toEqual( {
			url: new URL( srcset[ 0 ].split( ' ' )[ 0 ] ),
			width: 100,
			height: 50,
		} );

		expect( findClosestImageSize( srcset, 1300 ) ).toEqual( {
			url: new URL( srcset[ 2 ].split( ' ' )[ 0 ] ),
			width: 1400,
			height: 700,
		} );
	} );

	it( 'should find the closest image even if the srcset is unordered', () => {
		const unorderedSrcset = [
			createImageSize( '1400,700', '1400w' ),
			createImageSize( '100,50', '100w' ),
			createImageSize( '400,250', '400w' ),
		];
		expect( findClosestImageSize( unorderedSrcset, 1300 ) ).toEqual( {
			url: new URL( unorderedSrcset[ 0 ].split( ' ' )[ 0 ] ),
			width: 1400,
			height: 700,
		} );

		expect( findClosestImageSize( unorderedSrcset, 51 ) ).toEqual( {
			url: new URL( unorderedSrcset[ 1 ].split( ' ' )[ 0 ] ),
			width: 100,
			height: 50,
		} );

		expect( findClosestImageSize( unorderedSrcset, 351 ) ).toEqual( {
			url: new URL( unorderedSrcset[ 2 ].split( ' ' )[ 0 ] ),
			width: 400,
			height: 250,
		} );
	} );

	it( "shouldn't find closest image if the closest image isn't close enough in size", () => {
		expect( findClosestImageSize( srcset, 50 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 110 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 1100 ) ).toBeUndefined();
		expect( findClosestImageSize( srcset, 1200 ) ).toBeUndefined();
	} );
} );

function untrackedDynamicSrcset( img: HTMLImageElement ) {
	dynamicSrcset( img );
	img.srcset = img.srcset.replaceAll( /&_jb=\w+/gim, '' );
}

describe( 'dynamicSrcset', () => {
	let img: HTMLImageElement;

	it( '[manual validation] should create a new srcset entry for the target size', () => {
		window.innerWidth = 9999;
		window.devicePixelRatio = 1;
		const manualValidationImg = document.createElement( 'img' );

		manualValidationImg.setAttribute( 'src', 'https://i0.wp.com/example.com/image.jpg' );
		manualValidationImg.setAttribute(
			'srcset',
			`https://i0.wp.com/example.com/image.jpg?resize=100%2C200 1000w, https://i0.wp.com/example.com/image.jpg?resize=400%2C200 400w, https://i0.wp.com/example.com/image.jpg?resize=1400%2C700 1400w`
		);
		manualValidationImg.setAttribute( 'width', '800' );
		manualValidationImg.setAttribute( 'height', '400' );
		setBoundingRect( manualValidationImg, 800, 400 );

		untrackedDynamicSrcset( manualValidationImg );
		expect( manualValidationImg.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=800%2C400 9999w`
		);

		window.devicePixelRatio = 2;
		untrackedDynamicSrcset( manualValidationImg );
		expect( manualValidationImg.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=1600%2C800 19998w`
		);
	} );

	const testDevicePixelRatios = [ 1, 1.5 ];

	testDevicePixelRatios.forEach( devicePixelRatio => {
		const w = ( value: number ) => `${ value * devicePixelRatio }w`;
		describe( `with devicePixelRatio ${ devicePixelRatio }`, () => {
			beforeEach( () => {
				window.devicePixelRatio = devicePixelRatio;
				window.innerWidth = 5000;
				img = document.createElement( 'img' );
				img.src = 'https://i0.wp.com/example.com/image.jpg?resize=4444%2C2222';
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
				untrackedDynamicSrcset( img );
				expect( img.srcset ).toContain( createImageSize( '100,50', '100w' ) );
				expect( img.srcset ).toContain( createImageSize( '400,250', '400w' ) );
				expect( img.srcset ).toContain( createImageSize( '1400,700', '1400w' ) );
			} );

			it( 'should create a new srcset entry for the target size', () => {
				untrackedDynamicSrcset( img );
				expect( img.srcset ).toContain( createImageSize( '1000,500', w( window.innerWidth ) ) );
			} );

			it( 'should reuse existing srcset entry if the target size is close enough', () => {
				setBoundingRect( img, 396, 248 );
				untrackedDynamicSrcset( img );
				expect( img.srcset ).toContain( createImageSize( '400,250', w( window.innerWidth ) ) );
			} );

			it( "shouldn't upscale the image when reusing an srcset entry", () => {
				setBoundingRect( img, 420, 260 );
				untrackedDynamicSrcset( img );
				expect( img.srcset ).toContain( createImageSize( '420,260', w( window.innerWidth ) ) );
			} );

			it( 'should not update attributes if conditions are not met', () => {
				const image = document.createElement( 'img' );
				image.src = 'https://i0.wp.com/example.com/image.jpg';

				untrackedDynamicSrcset( image );

				expect( image.srcset ).toBe( '' );
				expect( image.sizes ).toBe( '' );
			} );
		} );
	} );

	it( 'should reuse existing src image if the target size is close enough', () => {
		window.innerWidth = 5000;
		window.devicePixelRatio = 1;
		setBoundingRect( img, 4400, 2200 );
		untrackedDynamicSrcset( img );
		expect( img.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=4444%2C2222 5000w`
		);
		window.devicePixelRatio = 1.5;
		untrackedDynamicSrcset( img );
		expect( img.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=6600%2C3300 7500w`
		);
	} );

	it( 'should reuse existing src image after accounting for DPR > 1', () => {
		window.innerWidth = 5000;

		window.devicePixelRatio = 1;
		// Fixed DPR 1 sizes as they'd appear in DOM
		const srcset = [
			createImageSize( '100,50', '100w' ),
			createImageSize( '400,250', '400w' ),
			createImageSize( '1400,700', '1400w' ),
		];

		// Pretend this is a dense display rendering a small image
		window.devicePixelRatio = 3;
		img.srcset = srcset.join( ',' );
		setBoundingRect( img, 460, 230 );
		untrackedDynamicSrcset( img );
		expect( img.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=1400%2C700 15000w`
		);

		setBoundingRect( img, 500, 250 );
		untrackedDynamicSrcset( img );
		expect( img.srcset ).toContain(
			`https://i0.wp.com/example.com/image.jpg?resize=1500%2C750 15000w`
		);
	} );
} );
