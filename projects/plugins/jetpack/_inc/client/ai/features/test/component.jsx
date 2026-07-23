import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import AiFeatures from '../index';

// The component module imports the webpack-aliased 'lib/analytics', which
// doesn't resolve under jest — provide it virtually. (jest.mock is hoisted
// above the imports, so the import above receives the mock.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

describe( 'AiFeatures rendering', () => {
	const renderFeatures = ( overrides = {} ) =>
		render(
			<AiFeatures
				settings={ {
					host_allows_ai: true,
					master_enabled: true,
					features: {
						writing_assistant: { enabled: true },
						ai_search: { enabled: false, requires_upgrade: true },
					},
					...overrides,
				} }
				savingKeys={ new Set() }
				onUpdate={ jest.fn() }
			/>
		);

	test( 'a usable row: toggle enabled with its saved value and an action link', () => {
		renderFeatures();

		const toggle = screen.getByRole( 'checkbox', { name: /Writing Assistant/ } );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeEnabled();
		expect( screen.getByText( 'Try it out in the editor' ) ).toBeInTheDocument();
	} );

	test( 'requires_upgrade: badge shown, toggle disabled but visible, Learn more kept', () => {
		renderFeatures();

		expect( screen.getByText( 'Requires upgrade' ) ).toBeInTheDocument();
		const toggle = screen.getByRole( 'checkbox', { name: /AI Search/ } );
		expect( toggle ).toBeDisabled();
		expect( toggle ).not.toBeChecked();
		expect( screen.getByText( 'Learn more' ) ).toBeInTheDocument();
	} );

	test( 'no Search entitlement: the badge popover names the upgrade remedy', async () => {
		renderFeatures( { plan: { supports_ai: true, supports_search: false } } );

		// The popover trigger is named by its visible text (WCAG 2.5.3).
		await userEvent.click( screen.getByRole( 'button', { name: 'Requires upgrade' } ) );
		await expect(
			screen.findByText( 'Requires Jetpack Search or Complete plans' )
		).resolves.toBeInTheDocument();
	} );

	test( 'Search plan present but not set up: the badge popover points at setup', async () => {
		renderFeatures( { plan: { supports_ai: true, supports_search: true } } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Requires upgrade' } ) );
		await expect(
			screen.findByText( 'Set up Jetpack Search to enable this feature' )
		).resolves.toBeInTheDocument();
	} );

	test( 'free Search plan: the remedy is an upgrade, not setup', async () => {
		// The free tier reports supports_search, but AI Search needs the paid
		// product — the setup copy would send the user down the wrong path.
		renderFeatures( {
			plan: { supports_ai: true, supports_search: true, is_free_search_plan: true },
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'Requires upgrade' } ) );
		await expect(
			screen.findByText( 'Requires Jetpack Search or Complete plans' )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( 'Set up Jetpack Search to enable this feature' )
		).not.toBeInTheDocument();
	} );

	test( 'no plan data at all: falls back to the upgrade copy, not setup', async () => {
		// Entitlement must be proven, not assumed — with `plan` missing the
		// setup copy would send an unentitled site down the wrong path.
		renderFeatures();

		await userEvent.click( screen.getByRole( 'button', { name: 'Requires upgrade' } ) );
		await expect(
			screen.findByText( 'Requires Jetpack Search or Complete plans' )
		).resolves.toBeInTheDocument();
	} );

	test( 'hovering the badge opens the popover with the case copy', async () => {
		renderFeatures( { plan: { supports_ai: true, supports_search: false } } );

		await userEvent.hover( screen.getByRole( 'button', { name: 'Requires upgrade' } ) );

		await expect(
			screen.findByText( 'Requires Jetpack Search or Complete plans' )
		).resolves.toBeInTheDocument();
	} );

	test( 'master off: notice with a My Jetpack link, toggles keep saved values but disable, links hidden', () => {
		renderFeatures( { master_enabled: false } );

		expect( screen.getByText( 'Jetpack AI is turned off for this site.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Manage in My Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack'
		);

		// The saved value stays visible — the toggle must not misreport it as off.
		const toggle = screen.getByRole( 'checkbox', { name: /Writing Assistant/ } );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeDisabled();

		expect( screen.queryByText( 'Try it out in the editor' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Learn more' ) ).not.toBeInTheDocument();
	} );

	test( 'not connected: connect notice, toggles keep saved values but disable, links and badge hidden', () => {
		renderFeatures( { is_connected: false } );

		expect( screen.getByText( 'Jetpack is not connected to WordPress.com.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);

		// The saved value stays visible — the toggle must not misreport it as off.
		const toggle = screen.getByRole( 'checkbox', { name: /Writing Assistant/ } );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeDisabled();

		// The connection ask comes before any upgrade messaging: without a
		// connection the plan is unknown, so no upgrade badge may show.
		expect( screen.queryByText( 'Requires upgrade' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Try it out in the editor' ) ).not.toBeInTheDocument();
	} );

	test( 'not connected takes precedence over the master-off notice', () => {
		renderFeatures( { is_connected: false, master_enabled: false } );

		expect( screen.getByText( 'Jetpack is not connected to WordPress.com.' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Jetpack AI is turned off for this site.' )
		).not.toBeInTheDocument();
	} );

	// A plan without paid Jetpack AI still has the free tier (every connected
	// site gets free requests), so the paid-plan signal must not lock the page:
	// no site-wide notice, and the free-tier features stay usable.
	test( 'free plan: no plan notice, toggles stay usable, action links kept', () => {
		renderFeatures( { is_connected: true, plan: { supports_ai: false } } );

		expect(
			screen.queryByText( "This site's plan doesn't include Jetpack AI." )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Upgrade to get Jetpack AI' } )
		).not.toBeInTheDocument();

		const toggle = screen.getByRole( 'checkbox', { name: /Writing Assistant/ } );
		expect( toggle ).toBeChecked();
		expect( toggle ).toBeEnabled();
		expect( screen.getByText( 'Try it out in the editor' ) ).toBeInTheDocument();
	} );

	test( 'free plan: toggling a feature still saves', async () => {
		const onUpdate = jest.fn().mockResolvedValue( true );
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					is_connected: true,
					plan: { supports_ai: false },
					features: { writing_assistant: { enabled: true } },
				} }
				savingKeys={ new Set() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) );

		expect( onUpdate ).toHaveBeenCalledWith( { features: { writing_assistant: false } } );
	} );

	test( 'free plan: paid-only features keep their per-feature upgrade badge', () => {
		renderFeatures( { is_connected: true, plan: { supports_ai: false } } );

		// The per-feature requires_upgrade path is the only upgrade surface —
		// AI Search stays gated while the free-tier rows work.
		expect( screen.getByText( 'Requires upgrade' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: /AI Search/ } ) ).toBeDisabled();
	} );

	test( 'free plan AND master off: the master-off notice shows', () => {
		renderFeatures( { is_connected: true, plan: { supports_ai: false }, master_enabled: false } );

		expect( screen.getByText( 'Jetpack AI is turned off for this site.' ) ).toBeInTheDocument();
	} );

	// Gated toggles must be inert, not merely styled disabled.
	test.each( [
		[ 'not connected', { is_connected: false } ],
		[ 'master off', { master_enabled: false } ],
	] )( '%s fires no save and no Tracks event', async ( _label, overrides ) => {
		analytics.tracks.recordEvent.mockClear();
		const onUpdate = jest.fn().mockResolvedValue( true );
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					is_connected: true,
					features: { writing_assistant: { enabled: true } },
					...overrides,
				} }
				savingKeys={ new Set() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) );

		expect( onUpdate ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );

	test( 'toggling a row sends a partial update for just that key', async () => {
		analytics.tracks.recordEvent.mockClear();
		const onUpdate = jest.fn().mockResolvedValue( true );
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					features: { writing_assistant: { enabled: true } },
				} }
				savingKeys={ new Set() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) );

		expect( onUpdate ).toHaveBeenCalledWith( { features: { writing_assistant: false } } );
	} );

	test( 'records the Tracks event only after a successful save', async () => {
		analytics.tracks.recordEvent.mockClear();
		const onUpdate = jest.fn().mockResolvedValue( true );
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					features: { writing_assistant: { enabled: true } },
				} }
				savingKeys={ new Set() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_ai_feature_toggled', {
			feature: 'writing_assistant',
			enabled: false,
		} );
	} );

	test( 'does not record the Tracks event when the save fails', async () => {
		analytics.tracks.recordEvent.mockClear();
		const onUpdate = jest.fn().mockResolvedValue( false );
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					features: { writing_assistant: { enabled: true } },
				} }
				savingKeys={ new Set() }
				onUpdate={ onUpdate }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) );

		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );

	test( 'Feature Clip does not render even when the endpoint reports it', () => {
		// The Clip row was dropped from the view; the backend key may still
		// arrive from the endpoint and must not produce a row.
		renderFeatures( {
			features: {
				image_editor: { enabled: true },
				feature_clip: { enabled: true, available: true },
			},
		} );

		expect( screen.queryByRole( 'checkbox', { name: /Feature Clip/ } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: /Image Editor/ } ) ).toBeInTheDocument();
	} );

	test( 'docs links open a new tab; wp-admin action links stay same-tab', () => {
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					is_connected: true,
					features: {
						writing_assistant: { enabled: false },
						image_editor: { enabled: true },
					},
				} }
				savingKeys={ new Set() }
				onUpdate={ jest.fn() }
			/>
		);

		// Writing Assistant is off → its action is the external "Learn more" docs link.
		const learnMore = screen.getByRole( 'link', { name: /Learn more/ } );
		expect( learnMore ).toHaveAttribute( 'target', '_blank' );

		// Image Editor is on → its action is the internal "Try it out" wp-admin link.
		const tryIt = screen.getByRole( 'link', { name: /Try it out/ } );
		expect( tryIt ).not.toHaveAttribute( 'target' );
	} );

	test( 'Try it out links target each feature surface', () => {
		render(
			<AiFeatures
				settings={ {
					master_enabled: true,
					is_connected: true,
					features: {
						writing_assistant: { enabled: true },
						image_editor: { enabled: true },
					},
				} }
				savingKeys={ new Set() }
				onUpdate={ jest.fn() }
			/>
		);

		// Writing Assistant asks the editor to pre-open the AI Assistant panel
		// (handled by the ai-assistant-plugin sidebar on the other end).
		expect( screen.getByRole( 'link', { name: 'Try it out in the editor' } ) ).toHaveAttribute(
			'href',
			'post-new.php?openSidebar=jetpack-ai-assistant'
		);

		// Image Studio has no URL-driven open mechanism (its bundle only adds
		// click handlers on the Media Library), so the link stays upload.php.
		expect( screen.getByRole( 'link', { name: 'Try it out' } ) ).toHaveAttribute(
			'href',
			'upload.php'
		);
	} );
} );
