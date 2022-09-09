import { render, screen } from '@testing-library/react';
import { JetpackContactFormEdit } from '../edit';

describe( 'Contact form', () => {
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
				},
			},
			{
				name: 'barry',
				title: 'a fine person',
				icon: 'edit',
				attributes: {
					className: 'wp-variation-barry',
				},
			},
		],
		defaultVariation: null,
	};

	afterEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders a variation selector list', () => {
		render( <JetpackContactFormEdit { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-node-access
		expect( screen.getByRole( 'list' ).children ).toHaveLength( 2 );
	} );
} );
