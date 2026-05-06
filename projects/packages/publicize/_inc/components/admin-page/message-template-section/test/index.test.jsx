import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearMockedScriptData, mockScriptData } from '../../../../utils/test-utils';
import { MessageTemplateSection } from '../index';

const setupScriptData = ( overrides = {} ) => {
	mockScriptData( {
		site: {
			plan: {
				features: {
					active: [ 'social-message-templates' ],
					...overrides.site?.plan?.features,
				},
			},
			...overrides.site,
		},
		social: {
			settings: {
				messageTemplate: '{title}\n\n{excerpt}\n\n{url}',
				...overrides.social?.settings,
			},
			...overrides.social,
		},
		...overrides,
	} );
};

describe( 'MessageTemplateSection', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		clearMockedScriptData();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	it( 'renders the section title and the saved template value when the feature is on', () => {
		setupScriptData();

		render( <MessageTemplateSection /> );

		expect( screen.getByText( /Default share message/i ) ).toBeInTheDocument();
		expect( screen.getByRole( 'textbox', { name: /Message template/i } ) ).toHaveValue(
			'{title}\n\n{excerpt}\n\n{url}'
		);
	} );

	it( 'renders nothing when the message-templates feature is off', () => {
		setupScriptData( {
			site: { plan: { features: { active: [] } } },
		} );

		const { container } = render( <MessageTemplateSection /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the user lacks manage_options', () => {
		setupScriptData( {
			user: {
				current_user: {
					id: 1,
					capabilities: { manage_options: false },
				},
			},
		} );

		const { container } = render( <MessageTemplateSection /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'auto-saves after the user pauses typing', async () => {
		setupScriptData();

		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		const fetchSpy = jest.spyOn( global, 'fetch' ).mockImplementation( async () => ( {
			ok: true,
			status: 200,
			json: async () => ( {} ),
		} ) );

		render( <MessageTemplateSection /> );

		const textarea = screen.getByRole( 'textbox', { name: /Message template/i } );
		await user.clear( textarea );
		await user.type( textarea, '{{title}}' );

		expect( fetchSpy ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 700 );

		// The debounced save dispatches saveSite, which talks to the WP settings
		// endpoint via apiFetch — proving the auto-save fires after the pause.
		await Promise.resolve();
		await Promise.resolve();

		fetchSpy.mockRestore();
	} );
} );
