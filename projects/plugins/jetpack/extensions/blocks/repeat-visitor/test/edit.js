/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// Need to mock InnerBlocks before importing the RepeatVisitorEdit component as it
// requires the Gutenberg store setup to operate.
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <p>Mocked inner block</p>,
} ) );

/**
 * Internal dependencies
 */
import { RepeatVisitorEdit } from '../components/edit';
import { CRITERIA_BEFORE, CRITERIA_AFTER, DEFAULT_THRESHOLD } from '../constants';

describe( '', () => {
	const defaultAttributes = {
		// 👀 Setup default block attributes.
		criteria: CRITERIA_AFTER,
		threshold: DEFAULT_THRESHOLD,
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'displays settings when block is selected', () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		const { container } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		expect( container.firstChild ).not.toHaveClass(
			'wp-block-jetpack-repeat-visitor--is-unselected'
		);
		expect( screen.getByText( 'Repeat Visitor' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Visit count threshold' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Visibility' ) ).toBeInTheDocument();

		// Notices are rendered in multiple places, so use getAllBy to expect more than one.
		expect(
			screen.getAllByText(
				'This block will only appear to people who have visited this page more than 3 times.'
			)
		).toHaveLength( 2 );
	} );

	test( 'changing visit count threshold updates attributes and notice', async () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		userEvent.type( screen.getByLabelText( 'Visit count threshold' ), '0' );

		expect( setAttributes ).toHaveBeenCalledWith( { threshold: 30 } );

		propsSelected.attributes = { ...defaultAttributes, threshold: 30 };
		rerender( <RepeatVisitorEdit { ...propsSelected } /> );

		await waitFor( () =>
			expect(
				screen.getAllByText(
					'This block will only appear to people who have visited this page more than 30 times.'
				)
			).toHaveLength( 2 )
		);
	} );

	test( 'clicking show before threshold updates attributes and notice', async () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		expect( screen.getByLabelText( 'Show before threshold' ) ).not.toBeChecked();
		expect( screen.getByLabelText( 'Show after threshold' ) ).toBeChecked();

		userEvent.click( screen.getByLabelText( 'Show before threshold' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { criteria: CRITERIA_BEFORE } );

		propsSelected.attributes = { ...defaultAttributes, criteria: CRITERIA_BEFORE };
		rerender( <RepeatVisitorEdit { ...propsSelected } /> );

		await waitFor( () => expect( screen.getByLabelText( 'Show before threshold' ) ).toBeChecked() );
		await waitFor( () =>
			expect( screen.getByLabelText( 'Show after threshold' ) ).not.toBeChecked()
		);

		await waitFor( () =>
			expect(
				screen.getAllByText(
					'This block will only appear to people who have visited this page at most 3 times.'
				)
			).toHaveLength( 2 )
		);
	} );

	test( 'clicking show after threshold updates attributes and notice', async () => {
		const propsSelected = { ...defaultProps, isSelected: true };
		propsSelected.attributes = { ...defaultAttributes, criteria: CRITERIA_BEFORE };

		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		expect( screen.getByLabelText( 'Show before threshold' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Show after threshold' ) ).not.toBeChecked();

		userEvent.click( screen.getByLabelText( 'Show after threshold' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { criteria: CRITERIA_AFTER } );

		propsSelected.attributes = { ...defaultAttributes, criteria: CRITERIA_AFTER };
		rerender( <RepeatVisitorEdit { ...propsSelected } /> );

		await waitFor( () =>
			expect( screen.getByLabelText( 'Show before threshold' ) ).not.toBeChecked()
		);
		await waitFor( () => expect( screen.getByLabelText( 'Show after threshold' ) ).toBeChecked() );

		await waitFor( () =>
			expect(
				screen.getAllByText(
					'This block will only appear to people who have visited this page more than 3 times.'
				)
			).toHaveLength( 2 )
		);
	} );

	test( 'adds class to hide placeholder when block is not selected', () => {
		const propsNotSelected = { ...defaultProps, isSelected: false };
		const { container } = render( <RepeatVisitorEdit { ...propsNotSelected } /> );

		expect( container.firstChild ).toHaveClass( 'wp-block-jetpack-repeat-visitor--is-unselected' );
	} );
} );
