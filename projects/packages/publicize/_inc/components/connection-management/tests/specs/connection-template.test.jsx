import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModernizationProvider } from '../../../../hooks/use-is-modernized';
import { setup } from '../../../../utils/test-factory';
import { clearMockedScriptData, mockScriptData } from '../../../../utils/test-utils';
import { ConnectionTemplateEditor } from '../../connection-template';

const FB = {
	service_name: 'facebook',
	connection_id: '2',
	display_name: 'Facebook',
	template: '',
};

const setupFeatures = ( ...active ) => {
	mockScriptData( {
		site: { plan: { features: { active } } },
	} );
};

const setupGated = ( overrides = {} ) => {
	mockScriptData( {
		site: { plan: { features: { active: [] } }, ...overrides.site },
		social: overrides.social,
	} );
};

// Renders inside the chassis modernization context, where the gated upsell
// variant is shown.
const renderModernized = ui => render( <ModernizationProvider>{ ui }</ModernizationProvider> );

describe( 'ConnectionTemplateEditor', () => {
	afterEach( () => {
		clearMockedScriptData();
		jest.clearAllMocks();
		jest.useRealTimers();
	} );

	test( 'renders the editor when both message-templates and enhanced-publishing are on', () => {
		setupFeatures( 'social-message-templates', 'social-enhanced-publishing' );
		setup();

		render( <ConnectionTemplateEditor connection={ FB } /> );

		expect(
			screen.getByRole( 'textbox', { name: /Custom message for this connection/i } )
		).toBeInTheDocument();
	} );

	test( 'saves without marking the connection as updating', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		setupFeatures( 'social-message-templates', 'social-enhanced-publishing' );
		const { stubUpdateConnectionById } = setup();

		render( <ConnectionTemplateEditor connection={ FB } /> );

		await user.type( screen.getByRole( 'textbox' ), 'Custom template' );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( stubUpdateConnectionById ).toHaveBeenCalledWith(
			'2',
			{ template: 'Custom template' },
			{ silent: true }
		);
	} );

	test( 'renders nothing when the message-templates feature is off', () => {
		setupFeatures( 'social-enhanced-publishing' );
		setup();

		const { container } = render( <ConnectionTemplateEditor connection={ FB } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing when the enhanced-publishing plan is off', () => {
		setupFeatures( 'social-message-templates' );
		setup();

		const { container } = render( <ConnectionTemplateEditor connection={ FB } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing when the user cannot manage the connection', () => {
		setupFeatures( 'social-message-templates', 'social-enhanced-publishing' );
		setup( { canUserManageConnection: false } );

		const { container } = render( <ConnectionTemplateEditor connection={ FB } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	describe( 'modernized chassis (gated upsell)', () => {
		test( 'renders the locked upsell variant when the message-templates feature is off', () => {
			setupFeatures( 'social-enhanced-publishing' );
			setup();

			renderModernized( <ConnectionTemplateEditor connection={ FB } /> );

			const textarea = screen.getByRole( 'textbox', {
				name: /Custom message for this connection/i,
			} );
			expect( textarea ).toBeDisabled();
			expect( screen.getByRole( 'link', { name: /upgrade your plan/i } ) ).toBeInTheDocument();
		} );

		test( 'renders the locked upsell variant when the enhanced-publishing plan is off', () => {
			setupFeatures( 'social-message-templates' );
			setup();

			renderModernized( <ConnectionTemplateEditor connection={ FB } /> );

			const textarea = screen.getByRole( 'textbox', {
				name: /Custom message for this connection/i,
			} );
			expect( textarea ).toBeDisabled();
			expect( screen.getByRole( 'link', { name: /upgrade your plan/i } ) ).toBeInTheDocument();
		} );

		test( 'surfaces the global default message inside the locked textarea', () => {
			setupGated( {
				social: { settings: { messageTemplate: 'Read my latest: {url}' } },
			} );
			setup();

			renderModernized( <ConnectionTemplateEditor connection={ FB } /> );

			expect(
				screen.getByRole( 'textbox', { name: /Custom message for this connection/i } )
			).toHaveValue( 'Read my latest: {url}' );
		} );

		test( 'renders nothing on Simple sites when the editor is gated', () => {
			setupGated( { site: { host: 'wpcom' } } );
			setup();

			const { container } = renderModernized( <ConnectionTemplateEditor connection={ FB } /> );

			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
