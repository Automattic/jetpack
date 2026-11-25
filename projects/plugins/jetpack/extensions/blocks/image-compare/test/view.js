import { screen } from '@testing-library/react';

jest.mock( '@wordpress/dom-ready', () => cb => cb() );

describe( 'Image Compare juxtapose view', () => {
	const createdImages = [];
	const originalImage = window.Image;
	const originalGetComputedStyle = window.getComputedStyle;

	beforeAll( () => {
		window.Image = function MockImage() {
			const img = document.createElement( 'img' );
			let naturalWidth = 0;
			let naturalHeight = 0;

			Object.defineProperty( img, 'naturalWidth', {
				get: () => naturalWidth,
				set: value => {
					naturalWidth = value;
				},
			} );
			Object.defineProperty( img, 'naturalHeight', {
				get: () => naturalHeight,
				set: value => {
					naturalHeight = value;
				},
			} );

			createdImages.push( img );
			return img;
		};

		window.getComputedStyle = element => {
			const style = originalGetComputedStyle( element );
			if ( element?.tagName === 'FIGURE' ) {
				return {
					width: '600px',
					height: '0px',
					getPropertyValue: prop => style.getPropertyValue( prop ),
				};
			}
			return style;
		};
		require( '../view' );
	} );

	beforeEach( () => {
		createdImages.length = 0;
		window.juxtapose.sliders.length = 0;
		document.body.innerHTML = `
			<figure>
				<div class="juxtapose" data-testid="wrapper">
					<img src="https://example.com/before.jpg" alt="Before image" />
					<img src="https://example.com/after.jpg" alt="After image" />
				</div>
			</figure>
		`;
	} );

	afterAll( () => {
		window.Image = originalImage;
		window.getComputedStyle = originalGetComputedStyle;
	} );

	test( 'renders slider using loaded after image dimensions when before image fails to load', () => {
		const wrapper = screen.getByTestId( 'wrapper' );
		const slider = window.juxtapose.makeSlider( wrapper );

		expect( createdImages ).toHaveLength( 2 );
		createdImages[ 0 ].onerror();
		createdImages[ 1 ].naturalWidth = 800;
		createdImages[ 1 ].naturalHeight = 400;
		createdImages[ 1 ].onload();

		expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'Before image' ) ).toBeInTheDocument();
		expect( screen.getByAltText( 'After image' ) ).toBeInTheDocument();
		expect( wrapper ).toHaveStyle( { width: '600px', height: '300px' } );

		const origSetDims = slider.setWrapperDimensions.bind( slider );
		const optimizedWidths = [];
		slider.setWrapperDimensions = () => {
			optimizedWidths.push( wrapper.style.width );
			origSetDims();
		};
		expect( slider.optimizeWrapper( 1000 ) ).toBe( window.juxtapose.OPTIMIZATION_ACCEPTED );
		expect( optimizedWidths ).toEqual( [ '800px' ] );
	} );

	test( 'does not collapse wrapper width to 0px in optimizeWrapper when after image fails', () => {
		const wrapper = screen.getByTestId( 'wrapper' );
		const slider = window.juxtapose.makeSlider( wrapper );

		createdImages[ 0 ].naturalWidth = 400;
		createdImages[ 0 ].naturalHeight = 200;
		createdImages[ 0 ].onload();
		createdImages[ 1 ].onerror();

		const origSetDims = slider.setWrapperDimensions.bind( slider );
		const optimizedWidths = [];
		slider.setWrapperDimensions = () => {
			optimizedWidths.push( wrapper.style.width );
			origSetDims();
		};
		expect( slider.optimizeWrapper( 1000 ) ).toBe( window.juxtapose.OPTIMIZATION_ACCEPTED );
		expect( optimizedWidths ).toEqual( [ '400px' ] );
	} );

	test( 'renders slider with attribute fallback dimensions when both images fail to load', () => {
		document.body.innerHTML = `
			<figure>
				<div class="juxtapose" data-testid="wrapper">
					<img src="https://example.com/before.jpg" alt="Before image" width="900" height="450" />
					<img src="https://example.com/after.jpg" alt="After image" />
				</div>
			</figure>
		`;
		const wrapper = screen.getByTestId( 'wrapper' );
		window.juxtapose.makeSlider( wrapper );

		createdImages[ 0 ].onerror();
		createdImages[ 1 ].onerror();

		expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
		expect( wrapper ).toHaveStyle( { width: '600px', height: '300px' } );
	} );

	test( 'uses 1:1 fallback and maxWidth in optimizeWrapper when both images fail without attributes', () => {
		const wrapper = screen.getByTestId( 'wrapper' );
		const slider = window.juxtapose.makeSlider( wrapper );

		createdImages[ 0 ].onerror();
		createdImages[ 1 ].onerror();

		expect( screen.getByRole( 'slider' ) ).toBeInTheDocument();
		expect( wrapper ).toHaveStyle( { width: '600px', height: '600px' } );

		const origSetDims = slider.setWrapperDimensions.bind( slider );
		const optimizedWidths = [];
		slider.setWrapperDimensions = () => {
			optimizedWidths.push( wrapper.style.width );
			origSetDims();
		};
		expect( slider.optimizeWrapper( 500 ) ).toBe( window.juxtapose.OPTIMIZATION_WAS_CONSTRAINED );
		expect( optimizedWidths ).toEqual( [ '500px' ] );
	} );
} );
