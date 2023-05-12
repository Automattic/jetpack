import { render, screen } from '@testing-library/react';
import { AuthorRecommendationEdit } from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

describe( 'AuthorRecommendationEdit Edit', () => {
	const defaultAttributes = {
		recommendations: [],
	};
	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'Displays empty subscriptions', () => {
		render( <AuthorRecommendationEdit { ...defaultProps } /> );

		expect(
			screen.getByText( 'No subscriptions to display', { exact: false } )
		).toBeInTheDocument();
	} );
} );
