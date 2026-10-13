// Tests for the storage help popover beside the Overview's usage reading
// (JETPACK-2332 / H3d).
//
// Two things are pinned beyond "it opens": when it appears at all — only where the
// storage limit, not the plan, decides how much history the site keeps — and its
// checkout link, which legacy builds from a `null` default because its only caller of
// `/addon-offer` renders at usage levels this popover does not.

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StorageSpace from '../src/dashboard/components/storage-space';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const GB = 1024 * 1024 * 1024;
const SITE = 'example.wordpress.com';

// 100GB of limit at 5GB a backup is 20 days, against a plan promising 30
// — the storage is deciding, so there is something to explain.
const LIMIT = 100 * GB;
const LAST_BACKUP = 5 * GB;
const PLAN_RETENTION = 30;

const TRIGGER = { name: 'Backup archive size' };

/**
 * Render inside an isolated QueryClient.
 *
 * @param ui - The tree to render.
 * @return The testing-library render result.
 */
function renderWithClient( ui: ReactNode ) {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

/**
 * Answer the three routes the section reads.
 *
 * Defaults describe a site well inside its limit, whose backups are big
 * enough that the limit — not the plan — caps its history.
 *
 * @param options          - Overrides.
 * @param options.size     - What `/site/backup/size` returns.
 * @param options.policies - What `/site/backup/policies` returns.
 * @param options.offer    - What `/site/backup/addon-offer` returns.
 */
function mockEndpoints( {
	size = {} as Record< string, unknown >,
	policies = {} as Record< string, unknown >,
	offer = {} as Record< string, unknown >,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/addon-offer' ) ) {
			return Promise.resolve( {
				slug: 'jetpack_backup_addon_storage_10gb_monthly',
				size_text: '10GB',
				pricing: { currency_code: 'USD', full_price: 4.95, discount_price: 4.95 },
				...offer,
			} );
		}
		if ( path.includes( '/site/backup/policies' ) ) {
			return Promise.resolve( {
				policies: {
					storage_limit_bytes: LIMIT,
					activity_log_limit_days: PLAN_RETENTION,
					...policies,
				},
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( {
				ok: true,
				size: 10 * GB,
				days_of_backups_saved: 14,
				last_backup_size: LAST_BACKUP,
				...size,
			} );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Open the popover and hand back its "Add more storage" link.
 *
 * @return The anchor.
 */
async function openAndFindCta(): Promise< HTMLElement > {
	await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );
	return screen.findByRole( 'link', { name: /Add more storage/ } );
}

/**
 * The forecast sentence, once the popover is open.
 *
 * Found on its opening words: the copy wraps the day count in `<strong>`, and Testing
 * Library's matcher reads only an element's own text nodes. Assert the rest with
 * `toHaveTextContent`.
 *
 * @return The element carrying the sentence.
 */
function forecastLine(): Promise< HTMLElement > {
	return screen.findByText( /^Based on the current size of your site/ );
}

/**
 * Let whatever the popover started finish before asserting an absence.
 *
 * The two paragraphs render from figures already in hand, so awaiting them returns
 * while `/addon-offer` is still in flight. See `storage-addon-upsell.test.tsx`.
 */
async function settle(): Promise< void > {
	await act( async () => {
		await new Promise( resolve => setTimeout( resolve, 0 ) );
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	} );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockRecordEvent.mockReset();
	mockEndpoints();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		siteSuffix: SITE,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'when the popover appears', () => {
	it( 'offers the explanation when storage is what caps the history', async () => {
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByRole( 'button', TRIGGER ) ).resolves.toBeInTheDocument();
	} );

	it( 'says what it is in words, not only to a screen reader', async () => {
		// Reads `textContent`, because every accessible-name assertion in this file
		// also passed on the bare `ⓘ` this replaces. Visible words are the only thing
		// separating a labelled button from a glyph with a tooltip — and this renders
		// at the one level where nothing else suggests storage is worth a thought.
		renderWithClient( <StorageSpace /> );
		const trigger = await screen.findByRole( 'button', TRIGGER );

		expect( trigger ).toHaveTextContent( /^Backup archive size$/ );

		// The visible words *are* the accessible name rather than a second string
		// beside it, which is WCAG 2.5.3.
		expect( trigger ).toHaveAccessibleName( 'Backup archive size' );
	} );

	it( 'says nothing when the plan, not the storage, is what caps it', async () => {
		// 100GB at 1GB a backup is 100 days against a 30-day plan: the limit is not
		// the constraint, so there is nothing to explain.
		mockEndpoints( { size: { last_backup_size: 1 * GB } } );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the last backup size is unreported', async () => {
		// No divisor, so no forecast. Legacy folds this into the same zero it uses for
		// "not even one backup fits" and hides on it — right answer, by accident.
		mockEndpoints( { size: { last_backup_size: undefined } } );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when not even one backup fits in the limit', async () => {
		// 100GB of limit at a 200GB backup floors to zero — a real answer rather than
		// a missing one, but not one a small info button can usefully explain.
		mockEndpoints( { size: { last_backup_size: 200 * GB } } );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing when the forecast exactly matches what the plan promises', async () => {
		// 90GB at 3GB a backup is 30 days against a 30-day plan. Strict on purpose: at
		// parity the limit costs the reader nothing, so there is no shortfall.
		mockEndpoints( {
			size: { last_backup_size: 3 * GB },
			policies: { storage_limit_bytes: 90 * GB },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing once the section is already warning about storage', async () => {
		// Above `Normal` the section is already saying storage is running out; a
		// calmer explanation of how many days fit would be arguing with it.
		mockEndpoints( { size: { size: 90 * GB } } );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', TRIGGER ) ).not.toBeInTheDocument();
	} );

	it( 'starts closed', async () => {
		// Legacy auto-opens on first load. `Popover.Popup` takes focus when it opens,
		// so that would move the keyboard into a panel nobody asked for.
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByRole( 'button', TRIGGER ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( /Based on the current size of your site/ )
		).not.toBeInTheDocument();
	} );
} );

describe( 'what the popover says', () => {
	it( 'states the forecast in days, pluralized', async () => {
		renderWithClient( <StorageSpace /> );
		await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );

		await expect( forecastLine() ).resolves.toHaveTextContent(
			/^Based on the current size of your site, Jetpack will save 20 days of full backups\.$/
		);
	} );

	it( 'says "1 day of full backup" rather than "1 days"', async () => {
		// Floors to one. The singular is a separate msgid rather than a substitution,
		// so nothing else covers it.
		mockEndpoints( { size: { last_backup_size: 60 * GB } } );
		renderWithClient( <StorageSpace /> );
		await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );

		await expect( forecastLine() ).resolves.toHaveTextContent(
			/^Based on the current size of your site, Jetpack will save 1 day of full backup\.$/
		);
	} );

	it( 'links out to the guidance on shrinking a backup', async () => {
		renderWithClient( <StorageSpace /> );
		await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );

		const link = await screen.findByRole( 'link', { name: /reducing the backup size/ } );
		expect( link ).toHaveAttribute(
			'href',
			'https://jetpack.com/support/backup/jetpack-vaultpress-backup-storage-and-retention/#reduce-storage-size'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );
} );

describe( 'the popover checkout link', () => {
	it( 'carries a real product slug rather than an empty one', async () => {
		// The legacy bug this replaces: its slug comes from a store slot only the
		// upsell fills, so legacy builds `…/checkout/<site>/null`.
		renderWithClient( <StorageSpace /> );
		const href = ( await openAndFindCta() ).getAttribute( 'href' ) as string;

		expect( href ).toContain( '/jetpack_backup_addon_storage_10gb_monthly' );
		expect( href ).not.toMatch( /\/(null|undefined)\b/ );
	} );

	it( 'fetches the offer itself rather than waiting for a sibling to', async () => {
		// Nothing else on this screen asks for the offer at `Normal`, so without this
		// the slug above could only arrive by accident.
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByRole( 'button', TRIGGER ) ).resolves.toBeInTheDocument();

		await waitFor( () =>
			expect(
				mockApiFetch.mock.calls.filter( ( [ options ] ) =>
					String( options?.path ?? '' ).includes( '/site/backup/addon-offer' )
				)
			).toHaveLength( 1 )
		);
	} );

	it( 'keeps its link on a response the upsell would reject', async () => {
		// Where the two consumers of `useStorageAddonOffer` deliberately differ: the
		// upsell needs a size, a price and a currency for its label, while this button
		// says only "Add more storage" and needs the slug. The hook carries `slug` and
		// `sizeText` past its own price check for exactly this.
		mockEndpoints( { offer: { pricing: [] } } );
		renderWithClient( <StorageSpace /> );

		const href = ( await openAndFindCta() ).getAttribute( 'href' ) as string;
		expect( href ).toContain( '/jetpack_backup_addon_storage_10gb_monthly' );
	} );

	it( 'shows no link at all when the offer never arrives', async () => {
		// The explanation is still worth reading without it, so the
		// popover keeps its two paragraphs and drops only the button.
		mockEndpoints( { offer: { slug: undefined } } );
		renderWithClient( <StorageSpace /> );
		await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );

		await expect( forecastLine() ).resolves.toHaveTextContent(
			/^Based on the current size of your site, Jetpack will save 20 days of full backups\.$/
		);
		await settle();
		expect( screen.queryByRole( 'link', { name: /Add more storage/ } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'the popover Tracks event', () => {
	it( 'records nothing for opening the popover', async () => {
		// Legacy records only the purchase click, and so does this.
		renderWithClient( <StorageSpace /> );
		await openAndFindCta();

		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records the click itself under its own event name', async () => {
		// Its own name, not the section upsell's: legacy counts them separately.
		renderWithClient( <StorageSpace /> );
		const cta = await openAndFindCta();

		// Read from inside the click's own propagation — see
		// `storage-addon-upsell.test.tsx` for why the probe goes on `document`.
		const countAtClick = new Promise< number >( resolve => {
			document.addEventListener(
				'click',
				event => {
					event.preventDefault();
					resolve( mockRecordEvent.mock.calls.length );
				},
				{ once: true }
			);
		} );

		await userEvent.click( cta );

		await expect( countAtClick ).resolves.toBe( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_backup_upgrade_storage_prompt_from_popover_cta',
			{ site: SITE }
		);
	} );

	it( 'omits the site rather than reporting it as the string "undefined"', async () => {
		// No site slug means no checkout link, so there is no path on which a payload
		// could carry `site: undefined`.
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: undefined,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;
		renderWithClient( <StorageSpace /> );
		await userEvent.click( await screen.findByRole( 'button', TRIGGER ) );

		await expect( forecastLine() ).resolves.toHaveTextContent(
			/^Based on the current size of your site, Jetpack will save 20 days of full backups\.$/
		);
		await settle();
		expect( screen.queryByRole( 'link', { name: /Add more storage/ } ) ).not.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );

describe( 'the panel a11y contract', () => {
	// Everything here is behaviour `@wordpress/ui`'s `Popover` brings on its own. Pinned
	// because it is what that primitive is being paid for, and a later change to the
	// trigger or panel could take it away silently.

	/**
	 * Open the popover and hand back the trigger and the panel.
	 *
	 * @return Both elements.
	 */
	async function openPanel(): Promise< { trigger: HTMLElement; panel: HTMLElement } > {
		const trigger = await screen.findByRole( 'button', TRIGGER );
		await userEvent.click( trigger );
		return { trigger, panel: await screen.findByRole( 'dialog' ) };
	}

	it( 'exposes the panel as a dialog named by its title', async () => {
		renderWithClient( <StorageSpace /> );
		const { panel } = await openPanel();

		expect( panel ).toHaveAccessibleName( 'Backup archive size' );

		// Named by pointing at the title element rather than by copying the
		// string into an attribute, which is what `Popover.Title` is for.
		const titleId = panel.getAttribute( 'aria-labelledby' );
		expect( titleId ).toBeTruthy();
		/* eslint-disable-next-line testing-library/no-node-access -- the wiring is the assertion. */
		expect( document.getElementById( titleId as string ) ).toHaveTextContent(
			'Backup archive size'
		);
	} );

	it( 'closes on Escape', async () => {
		renderWithClient( <StorageSpace /> );
		await openPanel();

		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
	} );

	it( 'closes on a press outside it', async () => {
		renderWithClient( <StorageSpace /> );
		await openPanel();

		await userEvent.click( document.body );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
	} );

	it( 'returns focus to the trigger when it closes', async () => {
		renderWithClient( <StorageSpace /> );
		const { trigger } = await openPanel();

		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( trigger ).toHaveFocus() );
	} );
} );
