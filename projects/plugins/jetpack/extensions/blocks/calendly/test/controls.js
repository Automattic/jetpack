import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

	test( 'triggers onEditClick when user clicks button', async () => {
		const user = userEvent.setup();
		render( <CalendlyBlockControls { ...defaultProps } /> );

		await user.click( screen.getByRole( 'button' ) );
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

	const renderExpandedSettings = async ( user, props ) => {
		render( <CalendlyInspectorControls { ...props } /> );
		await user.click( screen.getByText( 'Calendar settings' ) );
	};

	test( 'displays calendar settings panel', () => {
		render( <CalendlyInspectorControls { ...defaultProps } /> );
		const panelHeaderButton = screen.getByText( 'Calendar settings' );
		// eslint-disable-next-line testing-library/no-node-access
		const panel = panelHeaderButton.closest( '.components-panel__body' );

		expect( panelHeaderButton ).toBeInTheDocument();
		expect( panel ).not.toHaveClass( 'is-opened' );
	} );

	test( 'renders embed form when panel is expanded', async () => {
		const user = userEvent.setup();
		await renderExpandedSettings( user, defaultProps );

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

	test( 'updates embedCode as when input value changes', async () => {
		const user = userEvent.setup();
		await renderExpandedSettings( user, defaultProps );

		const input = screen.getByPlaceholderText( 'Calendly web address or embed code…' );

		await user.click( input );
		await user.paste( '/30min' );
		expect( setEmbedCode ).toHaveBeenLastCalledWith( `${ defaultProps.embedCode }/30min` );
	} );

	test( 'parses embed code when form is submitted', async () => {
		const user = userEvent.setup();

		// Have parseEmbedCode call preventDefault() to avoid jsdom complaining that it doesn't know how to submit a form.
		parseEmbedCode.mockImplementation( e => e.preventDefault() );

		await renderExpandedSettings( user, defaultProps );

		const submitButton = await screen.findByText( 'Embed' );
		await user.click( submitButton );

		expect( parseEmbedCode ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'displays toggle control for hiding event details', async () => {
		const user = userEvent.setup();
		await renderExpandedSettings( user, defaultProps );

		const label = screen.getByLabelText( 'Hide event type details' );
		const checkbox = screen.getByRole( 'checkbox' );

		expect( label ).toBeInTheDocument();
		expect( checkbox ).toBeInTheDocument();
		expect( checkbox ).not.toBeChecked();
	} );

	test( 'displays checked toggle control for hiding event details', async () => {
		const user = userEvent.setup();
		const attributes = { ...defaultAttributes, hideEventTypeDetails: true };

		await renderExpandedSettings( user, { ...defaultProps, attributes } );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	test( 'updates block attributes when hide event details toggled', async () => {
		const user = userEvent.setup();
		await renderExpandedSettings( user, defaultProps );
		await user.click( screen.getByLabelText( 'Hide event type details' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			hideEventTypeDetails: ! defaultAttributes.hideEventTypeDetails,
		} );
	} );

	test( 'displays notice and link when URL present', async () => {
		const user = userEvent.setup();
		await renderExpandedSettings( user, defaultProps );

		const customizationHelpUrl =
			'https://jetpack.com/support/jetpack-blocks/calendly-block/#customizing-a-calendly-block';
		const noticeClass = `${ defaultProps.defaultClassName }-color-notice`;
		const linkText = 'Explore more customization options.';
		const link = screen.getByText( linkText );

		expect( link ).toBeInTheDocument();
		expect( link ).toHaveAttribute( 'href', customizationHelpUrl );
		// eslint-disable-next-line testing-library/no-node-access
		expect( link.closest( '.components-notice' ) ).toHaveClass( noticeClass );
	} );

	test( 'omits notice when no URL', async () => {
		const user = userEvent.setup();
		const noticeClass = `.${ defaultProps.defaultClassName }-color-notice`;
		const attributes = { ...defaultAttributes, url: undefined };
		const { container } = render(
			<CalendlyInspectorControls { ...{ ...defaultProps, attributes } } />
		);

		await user.click( screen.getByText( 'Calendar settings' ) );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( noticeClass ) ).not.toBeInTheDocument();
	} );
} );
