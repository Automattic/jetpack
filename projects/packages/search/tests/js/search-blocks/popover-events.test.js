import { isEventInsidePopoverRoot } from '../../../src/search-blocks/store/popover-events';

describe( 'isEventInsidePopoverRoot', () => {
	it( 'detects clicks that began inside a popover after the target is detached', () => {
		document.body.innerHTML = `
			<div data-jetpack-search-popover-root>
				<button type="button">Remove filter</button>
			</div>
		`;

		const root = document.querySelector( '[data-jetpack-search-popover-root]' );
		const button = document.querySelector( 'button' );
		const event = {
			target: button,
			composedPath: () => [ button, root, document.body, document, window ],
		};

		button.remove();

		expect( isEventInsidePopoverRoot( event ) ).toBe( true );
	} );

	it( 'falls back to the current target ancestry when composedPath is unavailable', () => {
		document.body.innerHTML = `
			<div data-jetpack-search-popover-root>
				<button type="button">Clear all</button>
			</div>
		`;

		expect( isEventInsidePopoverRoot( { target: document.querySelector( 'button' ) } ) ).toBe(
			true
		);
	} );

	it( 'ignores clicks outside search popovers', () => {
		document.body.innerHTML = '<button type="button">Outside</button>';

		expect( isEventInsidePopoverRoot( { target: document.querySelector( 'button' ) } ) ).toBe(
			false
		);
	} );
} );
