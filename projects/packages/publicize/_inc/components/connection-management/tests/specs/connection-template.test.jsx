import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe( 'ConnectionTemplateEditor', () => {
	afterEach( () => {
		clearMockedScriptData();
		jest.clearAllMocks();
		jest.useRealTimers();
	} );

	test( 'renders the editor when the site has social paid features', () => {
		setupFeatures( 'social-enhanced-publishing' );
		setup();

		render( <ConnectionTemplateEditor connection={ FB } /> );

		expect(
			screen.getByRole( 'textbox', { name: /Custom message for this connection/i } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /upgrade your plan/i } ) ).not.toBeInTheDocument();
	} );

	test( 'saves without marking the connection as updating', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		setupFeatures( 'social-enhanced-publishing' );
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

	test( 'renders the locked upsell variant when the site lacks paid features', () => {
		setupFeatures();
		setup();

		render( <ConnectionTemplateEditor connection={ FB } /> );

		const textarea = screen.getByRole( 'textbox', {
			name: /Custom message for this connection/i,
		} );
		expect( textarea ).toBeDisabled();
		expect( screen.getByRole( 'link', { name: /upgrade your plan/i } ) ).toBeInTheDocument();
	} );

	test( 'surfaces the global default message inside the locked textarea', () => {
		setupFeatures();
		setup( { socialSettings: { messageTemplate: 'Read my latest: {url}' } } );

		render( <ConnectionTemplateEditor connection={ FB } /> );

		expect(
			screen.getByRole( 'textbox', { name: /Custom message for this connection/i } )
		).toHaveValue( 'Read my latest: {url}' );
	} );

	test( 'renders nothing on Simple sites when the site lacks paid features', () => {
		mockScriptData( {
			site: { host: 'wpcom', plan: { features: { active: [] } } },
		} );
		setup();

		const { container } = render( <ConnectionTemplateEditor connection={ FB } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing when the user cannot manage the connection', () => {
		setupFeatures( 'social-enhanced-publishing' );
		setup( { canUserManageConnection: false } );

		const { container } = render( <ConnectionTemplateEditor connection={ FB } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
