import {
	calculateTargetSize,
	dynamicSrcset,
	findClosestImageSize,
	getImageSizeFromUrl,
	parseImageSize,
} from './srcset';

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

describe( 'findClosestImageSize', () => {
	const urls = [
		'https://i0.wp.com/example.com/image.jpg?resize=100,50 100w',
		'https://i0.wp.com/example.com/image.jpg?resize=200,100 200w',
		'https://i0.wp.com/example.com/image.jpg?resize=300,150 300w',
	];

	it( 'should return null if the urls are invalid', () => {
		expect( findClosestImageSize( [ 'foo.com', 'bar.com' ], 500 ) ).toBeUndefined();
	} );

	it( 'should find the closest image size', () => {
		expect( findClosestImageSize( urls, 250 ) ).toEqual( {
			url: 'https://i0.wp.com/example.com/image.jpg?resize=200,100',
			width: 200,
			height: 100,
		} );
		expect( findClosestImageSize( urls, 999 ) ).toEqual( {
			url: 'https://i0.wp.com/example.com/image.jpg?resize=300,150',
			width: 300,
			height: 150,
		} );
	} );

	it( 'should return undefined when the target width is smaller than the smallest image width', () => {
		expect( findClosestImageSize( urls, 50 ) ).toBeUndefined();
	} );
} );

function createImageSize( width: number, height: number ) {
	return `https://i0.wp.com/example.com/image.jpg?resize=${ encodeURIComponent(
		`${ width },${ height }`
	) } ${ width }w`;
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

describe( 'dynamicSrcset', () => {
	let img: HTMLImageElement;
	beforeEach( () => {
		window.devicePixelRatio = 1;
		window.innerWidth = 5000;
		img = document.createElement( 'img' );
		img.src = 'https://i0.wp.com/example.com/image.jpg';
		const srcset = [
			createImageSize( 100, 50 ),
			createImageSize( 400, 250 ),
			createImageSize( 1400, 700 ),
		];
		img.srcset = srcset.join( ',' );
		img.setAttribute( 'width', '1000' );
		img.setAttribute( 'height', '500' );

		// Mocking the bounding rect of the image
		setBoundingRect( img, 1000, 500 );
	} );

	it( 'srcset should include all original image sizes', () => {
		dynamicSrcset( img );
		expect( img.srcset ).toContain( createImageSize( 100, 50 ) );
		expect( img.srcset ).toContain( createImageSize( 400, 250 ) );
		expect( img.srcset ).toContain( createImageSize( 1400, 700 ) );
		expect( img.sizes ).toBe( 'auto' );
	} );

	it( 'should create a new srcset entry for the target size', () => {
		dynamicSrcset( img );
		expect( img.srcset ).toContain( encodeURIComponent( `${ 1000 },${ 500 }` ) );
		expect( img.srcset ).toContain( `${ window.innerWidth * window.devicePixelRatio }w` );
	} );

	it( 'should not update attributes if conditions are not met', () => {
		const image = document.createElement( 'img' );
		image.src = 'https://i0.wp.com/example.com/image.jpg';

		dynamicSrcset( image );

		expect( image.srcset ).toBe( '' );
		expect( image.sizes ).toBe( '' );
	} );
} );
