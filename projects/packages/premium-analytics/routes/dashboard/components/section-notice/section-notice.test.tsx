/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SectionNotice } from './section-notice';

// The container, not `screen`: the notice also mirrors its text into a live region on `document.body`.
describe( 'SectionNotice', () => {
	it( "shows the registration's message", () => {
		const { container } = render( <SectionNotice message="Your store has no orders yet." /> );

		expect( container ).toHaveTextContent( 'Your store has no orders yet.' );
	} );
} );
