import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepeatVisitorEdit } from '../components/edit';
import { CRITERIA_BEFORE, CRITERIA_AFTER, DEFAULT_THRESHOLD } from '../constants';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <p>Mocked inner block</p>,
} ) );

describe( 'Repeat-visitor', () => {
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

		// eslint-disable-next-line testing-library/no-node-access
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
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		await user.type( screen.getByLabelText( 'Visit count threshold' ), '0' );

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
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		expect( screen.getByLabelText( 'Show before threshold' ) ).not.toBeChecked();
		expect( screen.getByLabelText( 'Show after threshold' ) ).toBeChecked();

		await user.click( screen.getByLabelText( 'Show before threshold' ) );

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
		const user = userEvent.setup();
		const propsSelected = { ...defaultProps, isSelected: true };
		propsSelected.attributes = { ...defaultAttributes, criteria: CRITERIA_BEFORE };

		const { rerender } = render( <RepeatVisitorEdit { ...propsSelected } /> );

		expect( screen.getByLabelText( 'Show before threshold' ) ).toBeChecked();
		expect( screen.getByLabelText( 'Show after threshold' ) ).not.toBeChecked();

		await user.click( screen.getByLabelText( 'Show after threshold' ) );

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

		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( 'wp-block-jetpack-repeat-visitor--is-unselected' );
	} );
} );
