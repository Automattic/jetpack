// Tests for the "add more storage" offer under the Overview's storage
// meter (JETPACK-2331 / H3c), and for the query that prices it.
//
// The meter itself and the readings beside it are covered in
// `storage-meter.test.tsx` and `storage-usage-details.test.tsx`. This
// file is about the four things the offer can get wrong in ways nobody
// would notice: asking the route for a price before it can answer,
// quoting an amount in the wrong currency, building half a checkout URL,
// and recording the Tracks event somewhere other than the click.

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
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import StorageSpace from '../src/dashboard/components/storage-space';
import { useStorageAddonOffer } from '../src/dashboard/hooks/use-storage-addon-offer';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const GB = 1024 * 1024 * 1024;
const SITE = 'example.wordpress.com';

/** Figures that put the site above `Normal` without reaching `Full`. */
const CRITICAL = { size: 90 * GB, limit: 100 * GB };

/**
 * A provider wrapping each render in its own QueryClient.
 *
 * @param props          - Props.
 * @param props.children - The tree to wrap.
 * @return The wrapped tree.
 */
function Wrapper( { children }: { children: ReactNode } ) {
	// Held in state rather than rebuilt each render: a fresh client on
	// every render throws away the cache mid-test, which would make every
	// "how many requests went out" assertion here meaningless.
	const [ client ] = useState(
		() =>
			new QueryClient( {
				defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
			} )
	);
	return <QueryClientProvider client={ client }>{ children }</QueryClientProvider>;
}

/**
 * Render inside an isolated QueryClient.
 *
 * @param ui - The tree to render.
 * @return The testing-library render result.
 */
function renderWithClient( ui: ReactNode ) {
	return render( <Wrapper>{ ui }</Wrapper> );
}

/**
 * Answer the three routes the section reads.
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
				slug: 'jetpack_backup_addon_storage_100gb_monthly',
				size_text: '100GB',
				pricing: { currency_code: 'USD', full_price: 9.95, discount_price: 9.95 },
				...offer,
			} );
		}
		if ( path.includes( '/site/backup/policies' ) ) {
			return Promise.resolve( {
				policies: { storage_limit_bytes: CRITICAL.limit, activity_log_limit_days: 30, ...policies },
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( {
				ok: true,
				size: CRITICAL.size,
				days_of_backups_saved: 14,
				...size,
			} );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Every `/site/backup/addon-offer` path that was asked for.
 *
 * @return The paths, in call order.
 */
function offerRequests(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => String( options?.path ?? '' ) )
		.filter( path => path.includes( '/site/backup/addon-offer' ) );
}

/**
 * The offer's checkout link, once it has arrived.
 *
 * @return The anchor.
 */
function offerLink(): Promise< HTMLElement > {
	return screen.findByRole( 'link', { name: /additional storage/ } );
}

/**
 * The warning line, once it has arrived.
 *
 * @param pattern - What the line should say.
 * @return The element carrying it.
 */
function warning( pattern: RegExp ): Promise< HTMLElement > {
	return screen.findByText( pattern );
}

/**
 * Let whatever the section started finish before asserting an absence.
 *
 * Every "there is no offer link" assertion here is otherwise racing the
 * offer request rather than testing the thing it names. The warning line
 * and the usage reading both render from figures already in hand, so
 * awaiting either returns while `/addon-offer` is still in flight — and
 * "no link yet" is then true for a reason that has nothing to do with
 * the gate. Three separate mutations that wrongly drew a link survived
 * this suite before it was added, including one that quoted `$0.00`.
 *
 * Two macrotask turns inside `act`: the first lets the mocked response's
 * microtask chain run and React Query commit, the second lets the render
 * it schedules flush.
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

describe( 'the offer query', () => {
	// Asserted on the hook rather than through the section, because the
	// section renders nothing until *both* figures are known — so the
	// partial case this is about cannot be staged from up there at all.

	it( 'asks for nothing until both figures are known', async () => {
		// Each of the three ways a caller can be partly informed. Under a
		// gate that fired on either figure this sends two requests —
		// `…?storage_size=96636764160&storage_limit=` and
		// `…?storage_size=&storage_limit=107374182400`, both observed —
		// and neither is a partial answer. The dropped-arg form is a 400;
		// the empty-value form is worse, because the route's `'type' =>
		// 'numeric'` is not a WordPress schema type and validates nothing,
		// so an empty figure is compared against the limit and answered
		// with the smallest add-on.
		renderHook( () => useStorageAddonOffer( null, null ), { wrapper: Wrapper } );
		renderHook( () => useStorageAddonOffer( CRITICAL.size, null ), { wrapper: Wrapper } );
		renderHook( () => useStorageAddonOffer( null, CRITICAL.limit ), { wrapper: Wrapper } );

		// Settled rather than asserted immediately, and deliberately not
		// `waitFor`: React Query starts a fetch in an effect, and a
		// `waitFor` on an assertion that already holds returns on its first
		// pass — so it would report "no request" before an enabled query
		// had even tried.
		await settle();
		expect( offerRequests() ).toHaveLength( 0 );
	} );

	it( 'asks once both are known, and sends both', async () => {
		// The other half of the test above. Without this, disabling the
		// query permanently would satisfy it just as well.
		renderHook( () => useStorageAddonOffer( CRITICAL.size, CRITICAL.limit ), {
			wrapper: Wrapper,
		} );

		await waitFor( () => expect( offerRequests() ).toHaveLength( 1 ) );
		expect( offerRequests()[ 0 ] ).toContain( `storage_size=${ CRITICAL.size }` );
		expect( offerRequests()[ 0 ] ).toContain( `storage_limit=${ CRITICAL.limit }` );
	} );

	it( 'sends a zero usage figure rather than dropping it', async () => {
		// `apiPath` filters out `undefined` and `''`, and zero is neither.
		// A freshly connected site reports `size: 0`, and dropping the arg
		// there would turn a legitimate question into a 400 —
		// `rest_missing_callback_param`, which is what a `required` arg
		// gets when it is absent rather than empty.
		renderHook( () => useStorageAddonOffer( 0, CRITICAL.limit ), { wrapper: Wrapper } );

		await waitFor( () => expect( offerRequests() ).toHaveLength( 1 ) );
		expect( offerRequests()[ 0 ] ).toContain( 'storage_size=0' );
	} );
} );

describe( 'when the upsell appears', () => {
	it( 'says nothing at all while usage is Normal', async () => {
		mockEndpoints( { size: { size: 10 * GB } } );
		renderWithClient( <StorageSpace /> );

		// Awaited on the reading first, so this is a real absence rather
		// than an assertion that ran before anything had rendered.
		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		await settle();
		expect( screen.queryByRole( 'link', { name: /additional storage/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /storage limit/ ) ).not.toBeInTheDocument();
	} );

	it( 'does not even ask for a price while usage is Normal', async () => {
		// The gate is in the section rather than in the component, so a
		// site with room to spare never pays for the round trip to
		// WordPress.com's product catalogue that pricing this costs.
		mockEndpoints( { size: { size: 10 * GB } } );
		renderWithClient( <StorageSpace /> );

		await expect( screen.findByText( /^Using/ ) ).resolves.toBeInTheDocument();
		await settle();
		expect( offerRequests() ).toHaveLength( 0 );
	} );

	it( 'warns and offers once usage leaves Normal', async () => {
		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /You are very close to reaching your storage limit/ )
		).resolves.toBeInTheDocument();
		await expect( offerLink() ).resolves.toHaveTextContent(
			/^Add 100GB additional storage for \$9\.95\/month, billed monthly$/
		);
	} );

	it( 'still warns when the offer never arrives', async () => {
		// Legacy nests the warning inside the checkout button, so a failed
		// `/addon-offer` leaves a site that is nearly out of storage with
		// nothing on screen saying so. The two fail separately here.
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/backup/addon-offer' ) ) {
				return Promise.reject( new Error( 'catalogue unavailable' ) );
			}
			if ( path.includes( '/site/backup/policies' ) ) {
				return Promise.resolve( { policies: { storage_limit_bytes: CRITICAL.limit } } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, size: CRITICAL.size, days_of_backups_saved: 14 } );
			}
			return Promise.resolve( {} );
		} );

		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /You are very close to reaching your storage limit/ )
		).resolves.toBeInTheDocument();
		await settle();
		expect( screen.queryByRole( 'link', { name: /additional storage/ } ) ).not.toBeInTheDocument();
	} );

	it( 'offers no link when the pricing block came back empty', async () => {
		// `Wpcom_Products::get_product_pricing()` returns `array()` when
		// the slug is missing from the catalogue, which arrives as a JSON
		// `[]`. Legacy's `res.pricing &&` guard passes on it — `[]` is
		// truthy in JavaScript — and it then formats `undefined` as a
		// price, which the installed formatter renders as `$0.00`.
		mockEndpoints( { offer: { pricing: [] } } );
		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /You are very close to reaching your storage limit/ )
		).resolves.toBeInTheDocument();
		await settle();
		expect( screen.queryByRole( 'link', { name: /additional storage/ } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'what the offer says', () => {
	it( 'quotes a Brazilian site in reais, with no dollar sign anywhere', async () => {
		// The reason `price.jsx` was not ported. It reads `currencyCode`
		// off a pricing block whose key is `currency_code`, gets undefined,
		// and `getCurrencyObject` then falls back to `$` — verified against
		// the installed formatter. WordPress.com prices this catalogue from
		// where the *site* appears to be, so that is wrong for every
		// non-USD site on earth.
		mockEndpoints( {
			offer: { pricing: { currency_code: 'BRL', full_price: 44.95, discount_price: 44.95 } },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toHaveTextContent(
			/^Add 100GB additional storage for R\$44\.95\/month, billed monthly$/
		);
	} );

	it( 'quotes a currency with no minor unit without inventing one', async () => {
		mockEndpoints( {
			offer: { pricing: { currency_code: 'JPY', full_price: 1000, discount_price: 1000 } },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toHaveTextContent(
			/^Add 100GB additional storage for ¥1,000\/month, billed monthly$/
		);
	} );

	it( 'quotes the introductory price when one is running', async () => {
		mockEndpoints( {
			offer: { pricing: { currency_code: 'USD', full_price: 9.95, discount_price: 4.95 } },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toHaveTextContent( /\$4\.95\/month/ );
	} );

	it( 'ignores a discount that is not one', async () => {
		// The pricing helper seeds `discount_price` with the full cost, so
		// the two are equal far more often than not — and a catalogue that
		// ever sent a higher one must not be allowed to quote it.
		mockEndpoints( {
			offer: { pricing: { currency_code: 'USD', full_price: 9.95, discount_price: 19.95 } },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toHaveTextContent( /\$9\.95\/month/ );
	} );

	it( 'ignores a discount of zero rather than quoting the add-on as free', async () => {
		// A separate guard from the one above, and a separate failure: a
		// zero is *lower* than the full price, so the "is this really a
		// discount" comparison waves it through. What stops it is the
		// `> 0` test beside it, and without that this button reads
		// "$0.00/month" for something that costs $9.95.
		mockEndpoints( {
			offer: { pricing: { currency_code: 'USD', full_price: 9.95, discount_price: 0 } },
		} );
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toHaveTextContent( /\$9\.95\/month/ );
		expect( screen.queryByText( /\$0\.00/ ) ).not.toBeInTheDocument();
	} );

	it( 'names the level in the warning it leads with', async () => {
		// Four levels, four sentences, and the wording is the whole of what
		// tells "getting close" apart from "backups have stopped".
		mockEndpoints( { size: { size: 70 * GB } } );
		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /^You are close to reaching your storage limit/ )
		).resolves.toBeInTheDocument();
	} );

	it( 'reports the days saved when storage is full', async () => {
		mockEndpoints( {
			size: {
				size: 100 * GB,
				days_of_backups_saved: 3,
				days_of_backups_allowed: 3,
				min_days_of_backups_allowed: 5,
			},
		} );
		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /^You have reached your storage limit with 3 day\(s\) of backups saved/ )
		).resolves.toBeInTheDocument();
	} );

	it( 'reports the floor the plan keeps once backups start being discarded', async () => {
		// The one level whose sentence is built from
		// `min_days_of_backups_allowed` rather than the days actually
		// saved, and the only thing that reads that figure at all.
		mockEndpoints( {
			size: {
				size: 70 * GB,
				days_of_backups_saved: 10,
				days_of_backups_allowed: 10,
				min_days_of_backups_allowed: 5,
			},
		} );
		renderWithClient( <StorageSpace /> );

		await expect( warning( /up to the last 5 days\.$/ ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'the checkout link', () => {
	it( 'names the product and the site, and comes back here afterwards', async () => {
		renderWithClient( <StorageSpace /> );
		const link = await offerLink();
		const href = new URL( link.getAttribute( 'href' ) as string );

		expect( href.origin + href.pathname ).toBe(
			`https://wordpress.com/checkout/${ SITE }/jetpack_backup_addon_storage_100gb_monthly`
		);
		expect( href.searchParams.get( 'site' ) ).toBe( SITE );
		// The page the reader is standing on. The modernized dashboard
		// emits no admin URL, and legacy's rebuilt
		// `admin.php?page=jetpack-backup` resolves to this same place.
		expect( href.searchParams.get( 'redirect_to' ) ).toBe( window.location.href );
	} );

	it( 'shows no link at all when the connection global carries no site slug', async () => {
		// Legacy interpolates whatever it has, producing
		// `…/checkout/undefined/<product>`. Half a checkout URL is worse
		// than none: it still looks like a working button.
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: undefined,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;
		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /You are very close to reaching your storage limit/ )
		).resolves.toBeInTheDocument();
		await settle();
		expect( screen.queryByRole( 'link', { name: /additional storage/ } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'the Tracks event', () => {
	it( 'records nothing until the reader actually clicks', async () => {
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records the click itself, not the arrival at checkout', async () => {
		renderWithClient( <StorageSpace /> );
		const link = await offerLink();

		// A plain anchor, so there is no follow-up request to order the
		// event against — which is how `tracks-events.test.tsx` tells "on
		// click" from "on success" for the Back up now button. What
		// distinguishes it here is the window the count is read in: still
		// inside the click's own propagation, before the browser has been
		// allowed to leave and before anything asynchronous could have
		// run. An event moved to a `then`, to a `useEffect`, or to the
		// offer query's own success path all land outside it.
		//
		// The probe goes on `document`, not on the link. React 18
		// dispatches synthetic events from the root container, which sits
		// below `document` in the propagation path — a listener on the
		// link itself would run *before* the component's `onClick` and
		// read zero however the handler was written. `preventDefault` here
		// still cancels the navigation, which happens only after the event
		// has finished propagating.
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

		await userEvent.click( link );

		await expect( countAtClick ).resolves.toBe( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_backup_upgrade_storage_prompt_cta', {
			site: SITE,
		} );
	} );
} );

describe( 'a full site that reported no day count', () => {
	// `getUsageLevel` reaches `Full` two ways: from the branch guarded on
	// four truthy day counts, and from `100:` in the threshold table,
	// which needs none of them. Only the second is exercised here, and it
	// is not exotic — every field of `/site/backup/size` is optional, so
	// a response carrying `size` and nothing else lands on it.
	//
	// Verified before this was written:
	// `getUsageLevel( 100GB, 100GB, null, null, null, null )` → `'Full'`,
	// and the section then rendered the heading "Cloud storage full" and
	// the priced button with no warning line at all.

	beforeEach( () => {
		mockEndpoints( {
			size: { size: 100 * GB, days_of_backups_saved: undefined },
			policies: { storage_limit_bytes: 100 * GB },
		} );
	} );

	it( 'still says backups have stopped, without inventing a day count', async () => {
		renderWithClient( <StorageSpace /> );

		// Deliberately anchored: the counted sentence starts the same way
		// and would satisfy a loose match, so an assertion that did not
		// pin the ending would pass on "…with null day(s) of backups
		// saved", which is what legacy prints here.
		await expect(
			warning(
				/^You have reached your storage limit\. Backups have been stopped\. Please upgrade your storage to resume backups\.$/
			)
		).resolves.toBeInTheDocument();
	} );

	it( 'never renders the counted sentence with a missing count in it', async () => {
		renderWithClient( <StorageSpace /> );

		await expect( offerLink() ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /day\(s\) of backups saved/ ) ).not.toBeInTheDocument();
	} );

	it( 'says it even when the offer never arrives', async () => {
		// The half of this that legacy gets wrong twice over. Its warning
		// lives inside the checkout button, so no offer means no warning;
		// and on this path it has no count to put in the warning either.
		// A site whose backups have stopped would be shown an empty
		// section.
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/backup/addon-offer' ) ) {
				return Promise.reject( new Error( 'catalogue unavailable' ) );
			}
			if ( path.includes( '/site/backup/policies' ) ) {
				return Promise.resolve( { policies: { storage_limit_bytes: 100 * GB } } );
			}
			if ( path.includes( '/site/backup/size' ) ) {
				return Promise.resolve( { ok: true, size: 100 * GB } );
			}
			return Promise.resolve( {} );
		} );

		renderWithClient( <StorageSpace /> );

		await expect(
			warning( /^You have reached your storage limit\. Backups have been stopped/ )
		).resolves.toBeInTheDocument();
		await settle();
		expect( screen.queryByRole( 'link', { name: /additional storage/ } ) ).not.toBeInTheDocument();
	} );
} );
