/**
 * Tests for image-compare view.js.
 */

describe( 'ImageCompare frontend view.js', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		delete window.juxtapose;
		jest.resetModules();
	} );

	test( 'creates slider even when an image triggers an onerror load failure', () => {
		document.body.innerHTML = `
			<div class="juxtapose" data-mode="horizontal">
				<img src="https://example.com/broken.jpg" width="800" height="600" alt="Broken before" data-label="Before" />
				<img src="https://example.com/after.jpg" width="800" height="600" alt="Working after" data-label="After" />
			</div>
		`;

		const originalImage = global.Image;

		global.Image = function () {
			const img = document.createElement( 'img' );
			let srcVal = '';

			Object.defineProperty( img, 'src', {
				get() {
					return srcVal;
				},
				set( val ) {
					srcVal = val;
					setTimeout( () => {
						if ( val.includes( 'broken.jpg' ) ) {
							Object.defineProperty( img, 'naturalWidth', { value: 0 } );
							Object.defineProperty( img, 'naturalHeight', { value: 0 } );
							if ( typeof img.onerror === 'function' ) {
								img.onerror( new Event( 'error' ) );
							}
						} else {
							Object.defineProperty( img, 'naturalWidth', { value: 800 } );
							Object.defineProperty( img, 'naturalHeight', { value: 600 } );
							if ( typeof img.onload === 'function' ) {
								img.onload( new Event( 'load' ) );
							}
						}
					}, 10 );
				},
			} );

			return img;
		};

		return new Promise( ( resolve, reject ) => {
			try {
				require( '../view' );

				setTimeout( () => {
					try {
						const slider = document.querySelector( '.jx-slider' );
						expect( slider ).not.toBeNull();

						const handle = document.querySelector( '.jx-handle' );
						expect( handle ).not.toBeNull();

						const errorImages = document.querySelectorAll( '.jx-image-error' );
						expect( errorImages ).toHaveLength( 1 );

						const beforeImgContainer = document.querySelector( '.jx-image.jx-left' );
						expect( beforeImgContainer ).toHaveClass( 'jx-image-error' );

						global.Image = originalImage;
						resolve();
					} catch ( assertionError ) {
						global.Image = originalImage;
						reject( assertionError );
					}
				}, 60 );
			} catch ( err ) {
				global.Image = originalImage;
				reject( err );
			}
		} );
	} );

	test( 'handles both images failing gracefully without throwing NaN dimensions', () => {
		document.body.innerHTML = `
			<div class="juxtapose" data-mode="horizontal">
				<img src="https://example.com/broken-before.jpg" width="400" height="300" alt="Broken before" />
				<img src="https://example.com/broken-after.jpg" width="400" height="300" alt="Broken after" />
			</div>
		`;

		const originalImage = global.Image;

		global.Image = function () {
			const img = document.createElement( 'img' );
			let srcVal = '';

			Object.defineProperty( img, 'src', {
				get() {
					return srcVal;
				},
				set( val ) {
					srcVal = val;
					setTimeout( () => {
						Object.defineProperty( img, 'naturalWidth', { value: 0 } );
						Object.defineProperty( img, 'naturalHeight', { value: 0 } );
						if ( typeof img.onerror === 'function' ) {
							img.onerror( new Event( 'error' ) );
						}
					}, 10 );
				},
			} );

			return img;
		};

		return new Promise( ( resolve, reject ) => {
			try {
				require( '../view' );

				setTimeout( () => {
					try {
						const slider = document.querySelector( '.jx-slider' );
						expect( slider ).not.toBeNull();

						const errorImages = document.querySelectorAll( '.jx-image-error' );
						expect( errorImages ).toHaveLength( 2 );

						const wrapper = document.querySelector( '.juxtapose' );
						expect( wrapper.style.width ).not.toContain( 'NaN' );
						expect( wrapper.style.height ).not.toContain( 'NaN' );

						global.Image = originalImage;
						resolve();
					} catch ( assertionError ) {
						global.Image = originalImage;
						reject( assertionError );
					}
				}, 60 );
			} catch ( err ) {
				global.Image = originalImage;
				reject( err );
			}
		} );
	} );
} );
