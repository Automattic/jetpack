/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import FormatPicker from '../format-picker';
import { AD_FORMATS, DEFAULT_FORMAT } from '../constants';
import { AdVisibilityToggle } from '../controls';

const getFormat = format => AD_FORMATS.find( ( { tag } ) => tag === format );

describe( 'AdVisibilityToggle', () => {
	const onChange = jest.fn();
	const defaultProps = { value: false, onChange };
	const checkedProps = { value: true, onChange };

	beforeEach( () => {
		onChange.mockClear();
	} );

	test( 'renders visibility panel header', () => {
		render( <AdVisibilityToggle { ...defaultProps } /> );

		expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Visibility' );
	} );

	test( 'applies correct class to toggle control', () => {
		const { container } = render( <AdVisibilityToggle { ...defaultProps } /> );
		const toggle = container.querySelector( '.components-toggle-control' );

		expect( toggle ).toHaveClass( 'jetpack-wordads__mobile-visibility' );
	} );

	test( 'renders unchecked checkbox', () => {
		render( <AdVisibilityToggle { ...defaultProps } /> );
		const checkbox = screen.getByRole( 'checkbox' );

		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).not.toBeChecked();
	} );

	test( 'renders checked checkbox', () => {
		render( <AdVisibilityToggle { ...checkedProps } /> );
		const checkbox = screen.getByRole( 'checkbox' );

		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).toBeChecked();
	} );

	test( 'renders supplied label', () => {
		render( <AdVisibilityToggle { ...defaultProps } /> );

		expect( screen.getByText( 'Hide on mobile' ) ).toBeInTheDocument();
	} );

	test( 'displays help text', () => {
		render( <AdVisibilityToggle { ...defaultProps } /> );
		const help = 'Hides this block for site visitors on mobile devices.';

		expect( screen.getByText( help ) ).toBeInTheDocument();
	} );

	test( 'calls onChange when checkbox clicked', () => {
		render( <AdVisibilityToggle { ...defaultProps } /> );

		userEvent.click( screen.getByRole( 'checkbox' ) );
		expect( onChange ).toHaveBeenCalledWith( true );
	} );

	test( 'calls onChange when label clicked', () => {
		render( <AdVisibilityToggle { ...checkedProps } /> );

		userEvent.click( screen.getByText( 'Hide on mobile' ) );
		expect( onChange ).toHaveBeenCalledWith( false );
	} );
} );

describe( 'FormatPicker', () => {
	const onChange = jest.fn();
	const defaultFormat = getFormat( DEFAULT_FORMAT );
	const defaultProps = { value: DEFAULT_FORMAT, onChange };

	beforeEach( () => {
		onChange.mockClear();
	} );

	test( 'renders toolbar settings button with formats not visible', () => {
		render( <FormatPicker { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Pick an ad format' ) ).toBeInTheDocument();
		expect( screen.queryByText( defaultFormat.name ) ).not.toBeInTheDocument();
	} );

	test( 'displays dropdown with available options on toolbar button click', async () => {
		render( <FormatPicker { ...defaultProps } /> );

		userEvent.click( screen.getByLabelText( 'Pick an ad format' ) );
		await waitFor( () => screen.getByText( defaultFormat.name ) );

		AD_FORMATS.forEach( format => {
			expect( screen.getByText( format.name ) ).toBeInTheDocument();
		} );
	} );

	test( 'selects current format in dropdown', async () => {
		render( <FormatPicker { ...defaultProps } /> );

		userEvent.click( screen.getByLabelText( 'Pick an ad format' ) );
		await waitFor( () => screen.getByText( defaultFormat.name ) );

		expect( screen.getByText( defaultFormat.name ).innerHTML ).toMatch( /[A-Za-z0-9 ]+/ );
	} );

	test( 'applies correct class to toolbar button', () => {
		render( <FormatPicker { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Pick an ad format' ) ).toHaveClass( 'wp-block-jetpack-wordads__format-picker-icon' );
	} );

	test( 'applies format picker class to menu', async () => {
		render( <FormatPicker { ...defaultProps } /> );

		userEvent.click( screen.getByLabelText( 'Pick an ad format' ) );
		await waitFor( () => screen.getByText( defaultFormat.name ) );
		const menu = screen.getByRole( 'menu' );

		expect( menu ).toBeInTheDocument();
		expect( menu ).toHaveClass( 'wp-block-jetpack-wordads__format-picker' );
	} );

	test( 'calls onChange when option is clicked', async () => {
		render( <FormatPicker { ...defaultProps } /> );
		const leaderboard = getFormat( 'leaderboard' );

		userEvent.click( screen.getByLabelText( 'Pick an ad format' ) );
		await waitFor( () => screen.getByText( leaderboard.name ) );
		userEvent.click( screen.getByText( leaderboard.name ) );

		expect( onChange ).toHaveBeenCalledWith( leaderboard.tag );
	} );
} );
