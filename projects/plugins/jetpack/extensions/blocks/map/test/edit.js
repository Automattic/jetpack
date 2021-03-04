/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react';
// 👀 Remove any unneeded imports from above.

/**
 * Internal dependencies
 */
// 👀 Import the edit component you are testing.
// e.g. import WhatsAppButtonEdit from '../edit';

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
	 * 👀 Write tests specific to this block's edit component.
	 *
	 * Tests may cover behaviour such as:
	 * - Loading correctly
	 * - Children are rendered
	 * - Event handler callbacks are called
	 * - Correct attributes are applied in markup
	 * - Appropriate CSS classes applied
	 */

	/**
	 * 👀 Example:
	 * test( 'displays with customText attribute', () => {
	 * 		render( <YourEditComponent { ...defaultProps } /> );
	 * 		expect( screen.getByText( 'Custom text rendered in block' ) ).toBeInTheDocument();
	 * } );
	 */
	test( '', () => {

	} );
} );
