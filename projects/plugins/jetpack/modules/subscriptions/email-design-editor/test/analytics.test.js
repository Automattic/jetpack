const mockRecordEvent = jest.fn();
const mockInitialize = jest.fn();
const mockAssignSuperProps = jest.fn();

// Recorded in one list so a test can assert the order of the two, which matters: `initialize()`
// sets the super properties by replacing them.
const mockIdentityCalls = [];

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args ) => {
			mockIdentityCalls.push( 'initialize' );
			mockInitialize( ...args );
		},
		assignSuperProps: ( ...args ) => {
			mockIdentityCalls.push( 'assignSuperProps' );
			mockAssignSuperProps( ...args );
		},
		tracks: { recordEvent: ( ...args ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: () => 'jetpack',
} ) );

/**
 * What the page localises when the site may record.
 *
 * @param {object} overrides - Values to replace, or `undefined` to drop a key.
 * @return {object} A `tracks` value.
 */
function tracksData( overrides = {} ) {
	return {
		canSend: true,
		userData: { userid: 7, username: 'creator' },
		blogId: 12345,
		...overrides,
	};
}

/**
 * Load the module fresh, since whether it may record is module state.
 *
 * The package's hooks come from the same isolated registry, so a test drives them the way the
 * package would.
 *
 * @param {object|undefined} tracks - The `tracks` value to initialise with, or undefined to skip.
 * @return {object} The module, plus the isolated `@wordpress/hooks`.
 */
function loadAnalytics( tracks ) {
	let loaded = null;

	jest.isolateModules( () => {
		const analytics = require( '../src/analytics' );
		const hooks = require( '@wordpress/hooks' );

		if ( undefined !== tracks ) {
			analytics.initializeTracks( tracks );
		}

		analytics.forwardEditorEvents();

		loaded = { ...analytics, hooks };
	} );

	return loaded;
}

/**
 * Emit an event the way the package's collector does: one flat object, name prefixed.
 *
 * @param {object} hooks - The isolated `@wordpress/hooks`.
 * @param {string} name  - The package's own event name.
 * @param {object} props - The event's properties.
 * @return {void}
 */
function emitUpstream( hooks, name, props = {} ) {
	hooks.doAction( 'woocommerce_email_editor_events', {
		name: `email_editor_events_${ name }`,
		...props,
	} );
}

describe( 'Email design screen analytics', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIdentityCalls.length = 0;
	} );

	describe( 'whether the screen records at all', () => {
		it( 'records nothing until the page says the site may send', () => {
			const { recordDesignEvent } = loadAnalytics( undefined );

			recordDesignEvent( 'save', { outcome: 'saved' } );

			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );

		it( 'records nothing when the site may not send', () => {
			const { recordDesignEvent } = loadAnalytics( tracksData( { canSend: false } ) );

			recordDesignEvent( 'save', { outcome: 'saved' } );

			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );

		it( 'leaves the package’s own event system off when the site may not send', () => {
			const { hooks } = loadAnalytics( tracksData( { canSend: false } ) );

			expect(
				hooks.applyFilters( 'woocommerce_email_editor_events_tracking_enabled', false )
			).toBe( false );
		} );

		it( 'turns the package’s own event system on when it may', () => {
			const { hooks } = loadAnalytics( tracksData() );

			expect(
				hooks.applyFilters( 'woocommerce_email_editor_events_tracking_enabled', false )
			).toBe( true );
		} );
	} );

	describe( 'the identity it records against', () => {
		it( 'assigns the blog id after initialising, which replaces the super properties', () => {
			loadAnalytics( tracksData() );

			expect( mockInitialize ).toHaveBeenCalledWith( 7, 'creator' );
			expect( mockAssignSuperProps ).toHaveBeenCalledWith( { blog_id: 12345 } );
			expect( mockIdentityCalls ).toEqual( [ 'initialize', 'assignSuperProps' ] );
		} );

		it( 'records anonymously, with the blog id, when no user is connected', () => {
			const { recordDesignEvent } = loadAnalytics( tracksData( { userData: null } ) );

			recordDesignEvent( 'editor_ready' );

			expect( mockInitialize ).not.toHaveBeenCalled();
			expect( mockAssignSuperProps ).toHaveBeenCalledWith( { blog_id: 12345 } );
			expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'the events it records itself', () => {
		it( 'prefixes the name and carries the site type', () => {
			const { recordDesignEvent } = loadAnalytics( tracksData() );

			recordDesignEvent( 'save', { outcome: 'discarded' } );

			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_email_design_save', {
				site_type: 'jetpack',
				outcome: 'discarded',
			} );
		} );
	} );

	describe( 'the events it forwards from the package', () => {
		it( 'forwards an allowlisted event', () => {
			const { hooks } = loadAnalytics( tracksData() );

			emitUpstream( hooks, 'header_close_button_clicked' );

			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_newsletter_email_design_close_click',
				{ site_type: 'jetpack' }
			);
		} );

		it( 'carries the properties the allowlist names', () => {
			const { hooks } = loadAnalytics( tracksData() );

			emitUpstream( hooks, 'styles_sidebar_navigation_click', { path: 'typography' } );

			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_newsletter_email_design_styles_navigate',
				{ site_type: 'jetpack', path: 'typography' }
			);
		} );

		it.each( [ 'colors', 'background', 'typography', 'layout' ] )(
			'collapses the %s panel onto one event with a screen property',
			screen => {
				const { hooks } = loadAnalytics( tracksData() );

				emitUpstream( hooks, `styles_sidebar_screen_${ screen }_opened` );

				expect( mockRecordEvent ).toHaveBeenCalledWith(
					'jetpack_newsletter_email_design_styles_screen_open',
					{ site_type: 'jetpack', screen }
				);
			}
		);

		// The package emits around 32 events and carries the recipient's address on this one, so an
		// allowlist that leaked would publish it.
		it( 'drops an event the allowlist does not name, and its properties with it', () => {
			const { hooks } = loadAnalytics( tracksData() );

			emitUpstream( hooks, 'sent_preview_email', {
				postId: 42,
				email: 'subscriber@example.com',
			} );

			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );

		it( 'drops an event whose name is not the package’s', () => {
			const { hooks } = loadAnalytics( tracksData() );

			hooks.doAction( 'woocommerce_email_editor_events', { name: 'editor_layout_loaded' } );

			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );

		it( 'drops a payload carrying no name at all', () => {
			const { hooks } = loadAnalytics( tracksData() );

			hooks.doAction( 'woocommerce_email_editor_events', { tab: 'block' } );

			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'the design keys a save reports', () => {
		it( 'sorts them, so two saves of the same halves read the same', () => {
			const { designKeys } = loadAnalytics( tracksData() );

			expect( designKeys( { typography: {}, color: {} } ) ).toBe( 'color,typography' );
		} );

		it( 'names only the halves, not what is in them', () => {
			const { designKeys } = loadAnalytics( tracksData() );

			expect( designKeys( { color: { background: '#fff', text: '#000' } } ) ).toBe( 'color' );
		} );

		it.each( [ [ {} ], [ undefined ], [ null ] ] )( 'reports %p as nothing', value => {
			const { designKeys } = loadAnalytics( tracksData() );

			expect( designKeys( value ) ).toBe( '' );
		} );
	} );
} );
