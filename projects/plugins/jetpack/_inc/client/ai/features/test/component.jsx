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
} );
