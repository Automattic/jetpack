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
		hasInnerBlocks: false,
		replaceInnerBlocks,
		selectBlock,
		clientId: 1,
		instanceId: 2,
		className: '',
		blockType: '',
		variations: [
			{
				name: 'susan',
				title: 'a nice person',
				icon: 'book',
				attributes: {
					className: 'wp-variation-susan',
				}
			},
			{
				name: 'barry',
				title: 'a fine person',
				icon: 'edit',
				attributes: {
					className: 'wp-variation-barry',
				}
			}
		],
		defaultVariation: null,
	};

	afterEach( () => {
		setAttributes.mockClear();
	} );


	test( 'renders a variation selector list', () => {
		render( <JetpackContactFormEdit { ...defaultProps } /> );
		expect( screen.getByRole( 'list' ).children ).toHaveLength( 2 );
	} );
} );
