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
} );
