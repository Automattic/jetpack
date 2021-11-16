/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { CalendlyBlockControls, CalendlyInspectorControls } from '../controls';

describe( 'CalendlyBlockControls', () => {
	const onEditClick = jest.fn();
	const defaultProps = { onEditClick };

	beforeEach( () => {
		onEditClick.mockClear();
	} );

	test( 'displays edit toolbar button', () => {
		render( <CalendlyBlockControls { ...defaultProps } /> );
		const wrapper = screen.getByText( 'Edit' );

		expect( wrapper ).toBeInTheDocument();
		expect( wrapper ).toHaveAttribute( 'type', 'button' );
	} );

	test( 'triggers onEditClick when user clicks button', () => {
		render( <CalendlyBlockControls { ...defaultProps } /> );

		userEvent.click( screen.getByRole( 'button' ) );
		expect( onEditClick ).toHaveBeenCalledWith( true );
	} );
} );

describe( 'CalendlyInspectorControls', () => {
	const defaultAttributes = {
		hideEventTypeDetails: false,
		url: 'http://calendly.com/username',
	};

	const parseEmbedCode = jest.fn();
	const setAttributes = jest.fn();
	const setEmbedCode = jest.fn();

	const defaultProps = {
		attributes: defaultAttributes,
		defaultClassName: 'wp-block-jetpack-calendly',
		embedCode: 'http://calendly.com/username', // Kept the same as URL for brevity.
		parseEmbedCode,
		setAttributes,
		setEmbedCode,
	};

	beforeEach( () => {
		parseEmbedCode.mockClear();
		setAttributes.mockClear();
		setEmbedCode.mockClear();
	} );

	const renderExpandedSettings = ( props ) => {
		render( <CalendlyInspectorControls { ...props } /> );
		userEvent.click( screen.getByText( 'Calendar settings' ) );
	};

	test( 'displays calendar settings panel', () => {
		render( <CalendlyInspectorControls { ...defaultProps } /> );
		const panelHeaderButton = screen.getByText( 'Calendar settings' );
		const panel = panelHeaderButton.closest( '.components-panel__body' );

		expect( panelHeaderButton ).toBeInTheDocument();
		expect( panel ).not.toHaveClass( 'is-opened' );
	} );

	test( 'renders embed form when panel is expanded', () => {
		renderExpandedSettings( defaultProps );

		const input = screen.getByPlaceholderText( 'Calendly web address or embed code…' );
		const button = screen.getByText( 'Embed' );

		expect( input ).toBeInTheDocument();
		expect( input ).toHaveAttribute( 'id', 'embedCode' );
		expect( input ).toHaveAttribute( 'type', 'text' );
		expect( input ).toHaveValue( defaultProps.embedCode );

		expect( button ).toBeInTheDocument();
		expect( button ).toHaveAttribute( 'type', 'submit' );
		expect( button ).toHaveClass( 'is-secondary' );
	} );

	test( 'updates embedCode as when input value changes', () => {
		renderExpandedSettings( defaultProps );

		const input = screen.getByPlaceholderText( 'Calendly web address or embed code…' );

		userEvent.paste( input, '/30min' );
		expect( setEmbedCode ).toHaveBeenLastCalledWith( `${ defaultProps.embedCode }/30min` );
	} );

	test( 'parses embed code when form is submitted', async () => {
		renderExpandedSettings( defaultProps );

		const submitButton = await screen.findByText( 'Embed' );

		// fireEvent used as userEvent click on the Embed button fails to trigger submit.
		await fireEvent.submit( submitButton.closest( 'form' ) );

		expect( parseEmbedCode ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'displays toggle control for hiding event details', () => {
		renderExpandedSettings( defaultProps );

		const label = screen.getByLabelText( 'Hide event type details' );
		const checkbox = screen.getByRole( 'checkbox' );

		expect( label ).toBeInTheDocument();
		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).not.toBeChecked();
	} );

	test( 'displays checked toggle control for hiding event details', () => {
		const attributes = { ...defaultAttributes, hideEventTypeDetails: true };

		renderExpandedSettings( { ...defaultProps, attributes } );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	test( 'updates block attributes when hide event details toggled', () => {
		renderExpandedSettings( defaultProps );
		userEvent.click( screen.getByLabelText( 'Hide event type details' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			hideEventTypeDetails: ! defaultAttributes.hideEventTypeDetails,
		} );
	} );

	test( 'displays notice and link when URL present', () => {
		renderExpandedSettings( defaultProps );

		const colorHelpUrl = 'https://help.calendly.com/hc/en-us/community/posts/360033166114-Embed-Widget-Color-Customization-Available-Now-';
		const noticeClass = `${ defaultProps.defaultClassName }-color-notice`;
		const linkText = 'Follow these instructions to change the colors in this block.';
		const link = screen.getByText( linkText );

		expect( link ).toBeInTheDocument();
		expect( link ).toHaveAttribute( 'href', colorHelpUrl );
		expect( link.closest( '.components-notice' ) ).toHaveClass( noticeClass );
	} );

	test( 'omits notice when no URL', () => {
		const noticeClass = `.${ defaultProps.defaultClassName }-color-notice`;
		const attributes = { ...defaultAttributes, url: undefined };
		const { container } = render( <CalendlyInspectorControls { ...{ ...defaultProps, attributes } } /> );

		userEvent.click( screen.getByText( 'Calendar settings' ) );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( container.querySelector( noticeClass ) ).not.toBeInTheDocument();
	} );
} );
