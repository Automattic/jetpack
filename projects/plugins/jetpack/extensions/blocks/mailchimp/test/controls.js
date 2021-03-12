/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
// 👀 Remove any unneeded imports from above.

/**
 * Internal dependencies
 */
// 👀 Import the edit component you are testing.
// e.g. import WhatsAppButtonControls from '../controls';

describe( '', () => {
	const defaultAttributes = {
		// 👀 Setup default block attributes.
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		// 👀 Setup default block props.
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
	};

	// 👀 Tests setup.
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	/**
	 * 👀 Write tests specific to this block controls.
	 *
	 * These may cover whatever controls are added by the block
	 * e.g. Inspector or Block Toolbar controls.
	 *
	 * Tests may cover behaviour such as:
	 * - Correct fields included in controls
	 * - Appropriate attributes and defaults are applied
	 * - User interactions trigger correct event handlers etc.
	 */

	/**
	 * 👀 Example:
	 * test( 'loads settings when toolbar button clicked', async () => {
	 *		render( <WhatsAppButtonConfiguration { ...props } /> );
	 *		userEvent.click( screen.getByLabelText( 'WhatsApp Button Settings' ) );
	 *		await waitFor( () => screen.getByLabelText( 'Country code' ) );
	 *
	 *		expect( screen.getByLabelText( 'Country code' ) ).toBeInTheDocument();
	 * } );
	 */
	test( '', () => {

	} );
} );
