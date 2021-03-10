/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { JetpackContactFormEdit } from '../edit';
import defaultVariations from '../variations';


describe( '', () => {
	const defaultAttributes = {
		subject: '',
		to: '',
		customThankyou: '',
		customThankyouMessage: '',
		customThankyouRedirect: '',
		jetpackCRM: true,
	};

	const setAttributes = jest.fn();
	const selectBlock = jest.fn();
	const replaceInnerBlocks = jest.fn();

	const defaultProps = {
		// 👀 Setup default block props.
		attributes: defaultAttributes,
		setAttributes,
		siteTitle: '',
		postTitle: '',
		postAuthorEmail: '',
		hasInnerBlocks: true,
		replaceInnerBlocks,
		selectBlock,
		clientId: 1,
		instanceId: 2,
		className: '',
		blockType: '',
		variations: [],
		defaultVariation: null,
	};


	// 👀 Tests setup.
	beforeEach( () => {
	} );

	afterEach( () => {
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
		render( <JetpackContactFormEdit { ...defaultProps } /> );
		screen.debug();
	} );
} );
