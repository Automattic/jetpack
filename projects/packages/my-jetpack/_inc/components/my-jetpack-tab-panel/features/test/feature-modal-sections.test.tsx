import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureDelivery } from '../feature-delivery';
import { FeatureItem } from '../feature-item';
import { FeatureModal } from '../feature-modal';
import { FeaturePaid, UpgradeButton } from '../feature-paid';
import { resolveFeatureState } from '../feature-state';
import { FeaturesTrackingProvider } from '../features-tracking-context';
import type { FeatureState } from '../feature-state';

const mockRecordEvent = jest.fn();
jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

const feature = {
	slug: 'jetpack-forms',
	name: 'Forms',
	in_jetpack: true,
	plugin: '',
	plans: [ { slug: 'complete', name: 'Jetpack Complete' } ],
	paid_highlights: [ 'Secure file uploads' ],
	upgrade: { path: '', name: '' },
} as unknown as MainFeature;

const moduleState = ( override: false | 'active' | 'inactive', status: 'active' | 'inactive' ) =>
	( {
		feature,
		status,
		control: {
			kind: 'module',
			module: { module: 'contact-form', available: true, activated: status === 'active', override },
		},
	} ) as FeatureState;

const forcedOffPlugin = {
	feature: { ...feature, slug: 'boost', name: 'Boost', in_jetpack: false, plugin: 'jetpack-boost' },
	status: 'inactive',
	control: { kind: 'plugin', plugin: 'jetpack-boost', override: 'inactive' },
} as FeatureState;

const installedPlugin = {
	feature: {
		...feature,
		slug: 'anti-spam',
		name: 'Akismet Anti-spam',
		in_jetpack: false,
		plugin: 'akismet',
		plugin_name: 'Akismet Anti-spam',
		plugin_url: 'https://wordpress.org/plugins/akismet/',
		plans: [ { slug: 'security', name: 'Jetpack Security' } ],
		upgrade: { path: '/add-akismet', name: 'Jetpack Akismet Anti-spam' },
	},
	status: 'inactive',
	control: { kind: 'plugin', plugin: 'akismet' },
} as FeatureState;

describe( 'FeatureDelivery', () => {
	it( 'says nothing about turning on a module a host forced off', () => {
		const { container } = render(
			<FeatureDelivery state={ moduleState( 'inactive', 'inactive' ) } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'adds what to expect next as its own sentence', () => {
		const state = {
			...installedPlugin,
			feature: { ...installedPlugin.feature, setup_note: 'Choose a plan next.' },
		} as FeatureState;
		render( <FeatureDelivery state={ state } /> );

		expect( screen.getByText( 'Choose a plan next.' ) ).toBeInTheDocument();
		expect( screen.getByText( /plugin is already installed/ ) ).not.toHaveTextContent(
			'Choose a plan next.'
		);
	} );

	it( 'says nothing about turning on a plugin a host forced off', () => {
		const { container } = render( <FeatureDelivery state={ forcedOffPlugin } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'says nothing once the feature is on', () => {
		const { container } = render( <FeatureDelivery state={ moduleState( false, 'active' ) } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it.each( [
		[ 'module', moduleState( false, 'active' ) ],
		[ 'plugin', { ...installedPlugin, status: 'active' } as FeatureState ],
	] )( 'says why an active %s waiting for an account offers Connect', ( _, state ) => {
		render( <FeatureDelivery state={ { ...state, accountNeeded: true } } /> );

		expect( screen.getByText( 'Requires a connected WordPress.com account' ) ).toBeVisible();
	} );

	it( 'explains how to turn on a module nobody forced', () => {
		render( <FeatureDelivery state={ moduleState( false, 'inactive' ) } /> );

		expect( screen.getByText( /Built into Jetpack/ ) ).toBeInTheDocument();
	} );

	it( 'says why an install is blocked instead of what Install would do', () => {
		render(
			<FeatureDelivery
				state={ {
					...installedPlugin,
					control: { kind: 'install-plugin', plugin: 'akismet', blocked: 'not_permitted' },
				} }
			/>
		);

		expect(
			screen.getByText(
				'Your account can’t install plugins. Ask a site administrator to install Akismet Anti-spam.'
			)
		).toBeInTheDocument();
		expect( screen.queryByText( /Installing adds/ ) ).not.toBeInTheDocument();
	} );

	it( 'leaves out what to expect next when the install is blocked', () => {
		render(
			<FeatureDelivery
				state={ {
					...installedPlugin,
					feature: { ...installedPlugin.feature, setup_note: 'Choose a plan next.' },
					control: { kind: 'install-plugin', plugin: 'akismet', blocked: 'not_permitted' },
				} }
			/>
		);

		expect( screen.getByText( /can’t install plugins/ ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Choose a plan next.' ) ).not.toBeInTheDocument();
	} );

	it( 'links the installed plugin it will switch on', () => {
		render( <FeatureDelivery state={ installedPlugin } /> );

		expect( screen.getByRole( 'link', { name: 'Akismet Anti-spam' } ) ).toHaveAttribute(
			'href',
			'https://wordpress.org/plugins/akismet/'
		);
	} );
} );

describe( 'FeaturePaid', () => {
	it( 'offers no Upgrade or plan links for unavailable gated AI forced off', () => {
		const state = resolveFeatureState(
			{
				...feature,
				slug: 'jetpack-ai',
				product: 'jetpack-ai',
				upgrade: { path: '/add-ai', name: 'Jetpack AI' },
			},
			'active',
			undefined,
			{
				ai: {
					module: 'ai',
					available: false,
					unavailable_reason: 'Requires a connected WordPress.com account',
					override: 'inactive',
				} as never,
			},
			{}
		);
		expect( state.control.kind ).toBe( 'none' );
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);

		expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();
	} );

	it( 'keeps Upgrade and plans when an unavailable module has no standalone plugin', () => {
		const state = moduleState( false, 'inactive' );
		if ( state.control.kind === 'module' ) {
			state.control.module.available = false;
			state.control.module.unavailable_reason = 'A connection is required';
		}
		state.feature = {
			...feature,
			plugin: '',
			upgrade: { path: '/add-complete', name: 'Complete' },
		};
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);
		expect( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'Upgrade to Complete' } ) ).toBeVisible();
	} );

	it( 'leaves out the plans for a module a host forced off', () => {
		render( <FeaturePaid state={ moduleState( 'inactive', 'inactive' ) } /> );

		expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();
	} );

	it( 'leaves out the plans and the upgrade for a plugin a host forced off', () => {
		const state = {
			...forcedOffPlugin,
			feature: {
				...forcedOffPlugin.feature,
				upgrade: { path: '/add-boost', name: 'Jetpack Boost' },
			},
		} as FeatureState;
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);

		expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
	} );

	it( 'links a plan name to its pricing page, which returns to this feature', () => {
		render( <FeaturePaid state={ moduleState( false, 'inactive' ) } /> );

		expect( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) ).toHaveAttribute(
			'href',
			'#/add-complete?return_feature=jetpack-forms'
		);
	} );

	it( 'keeps a plan name as text in offline Features', () => {
		const previous = window.myJetpackInitialState;
		window.myJetpackInitialState = { ...previous, isOfflineFeatures: true };
		try {
			render( <FeaturePaid state={ moduleState( false, 'inactive' ) } /> );

			expect( screen.getByText( /Included in/ ) ).toHaveTextContent(
				'Included in Jetpack Complete'
			);
			expect( screen.queryByRole( 'link', { name: 'Jetpack Complete' } ) ).not.toBeInTheDocument();
		} finally {
			window.myJetpackInitialState = previous;
		}
	} );

	it( 'links to the upgrade for a feature that sells on its own, returning to it after checkout', () => {
		render( <UpgradeButton state={ installedPlugin } /> );

		expect(
			screen.getByRole( 'link', { name: 'Upgrade to Jetpack Akismet Anti-spam' } )
		).toHaveAttribute( 'href', '#/add-akismet?return_feature=anti-spam' );
	} );

	it( 'sends the upgrade to a host\u2019s own plans, leaving out the Jetpack ones and the address', async () => {
		const url = 'https://wordpress.com/plans/example.com?plan=business-bundle';
		const state = {
			...installedPlugin,
			feature: {
				...installedPlugin.feature,
				upgrade: { path: '', name: 'WordPress.com Business', url },
			},
		} as FeatureState;
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);

		const upgrade = screen.getByRole( 'link', { name: 'Upgrade to WordPress.com Business' } );
		expect( upgrade ).toHaveAttribute( 'href', url );
		expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();

		// jsdom cannot navigate to another document.
		upgrade.addEventListener( 'click', event => event.preventDefault() );
		await userEvent.click( upgrade );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_features_upgrade_click', {
			feature: 'anti-spam',
			target: 'host',
		} );
	} );

	it( 'renews an expired plan on its purchase page, even where a host sells its own plans', async () => {
		const purchase = 'https://wordpress.com/me/purchases/example.com/123';
		const state = {
			feature: {
				...feature,
				slug: 'backup',
				name: 'Backup',
				plans: [ { slug: 'security', name: 'Jetpack Security' } ],
				upgrade: { path: '', name: 'WordPress.com Business', url: 'https://example.com/plans' },
			},
			product: { status: 'expired', managePaidPlanPurchaseUrl: purchase },
			status: 'inactive',
			control: { kind: 'plan' },
		} as unknown as FeatureState;
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);

		const renew = screen.getByRole( 'link', { name: 'Renew the plan for Backup' } );
		expect( renew ).toHaveAttribute( 'href', purchase );
		expect( renew ).toHaveTextContent( 'Renew' );
		expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();

		// jsdom cannot navigate to another document.
		renew.addEventListener( 'click', event => event.preventDefault() );
		await userEvent.click( renew );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_features_upgrade_click', {
			feature: 'backup',
			target: 'renew',
		} );
	} );

	it( 'drops the upgrade when the catalog has nothing to sell this site', () => {
		const state = {
			...installedPlugin,
			feature: { ...installedPlugin.feature, upgrade: { path: '', name: '' } },
		} as FeatureState;
		render(
			<>
				<FeaturePaid state={ state } />
				<UpgradeButton state={ state } />
			</>
		);

		expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
		expect( screen.getByText( /Included in/ ) ).toBeInTheDocument();
	} );

	it( 'records which plan a feature\u2019s details sent the site to', async () => {
		render(
			<FeaturesTrackingProvider filter="all" search="" view="grid">
				<FeaturePaid state={ moduleState( false, 'inactive' ) } />
			</FeaturesTrackingProvider>
		);

		await userEvent.click( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_features_plan_click',
			expect.objectContaining( {
				plan: 'complete',
				feature_slug: 'jetpack-forms',
				feature_name: 'Forms',
				feature_status: 'inactive',
				control_kind: 'module',
				event_version: 1,
				current_filter: 'all',
				view: 'grid',
			} )
		);
	} );

	it( 'names a plan the site already has without linking it to its own checkout', () => {
		const owned = {
			...moduleState( false, 'inactive' ),
			feature: {
				...feature,
				plans: [
					{ slug: 'growth', name: 'Jetpack Growth', owned: true },
					{ slug: 'complete', name: 'Jetpack Complete', owned: false },
				],
			},
		} as FeatureState;
		render( <FeaturePaid state={ owned } /> );

		expect( screen.getByText( /Included in/ ) ).toHaveTextContent( 'Jetpack Growth' );
		expect( screen.queryByRole( 'link', { name: 'Jetpack Growth' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) ).toBeInTheDocument();
	} );

	it( 'records nothing for a plan click outside the tab, where there is no context to report', async () => {
		render( <FeaturePaid state={ moduleState( false, 'inactive' ) } /> );
		mockRecordEvent.mockClear();

		await userEvent.click( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) );

		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records which feature an upgrade was chosen from', async () => {
		render( <UpgradeButton state={ installedPlugin } /> );

		await userEvent.click(
			screen.getByRole( 'link', { name: 'Upgrade to Jetpack Akismet Anti-spam' } )
		);

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_features_upgrade_click', {
			feature: 'anti-spam',
			target: '/add-akismet',
		} );
	} );
} );

describe( 'FeatureModal Free column', () => {
	const modalState = ( freeHighlights: string[] ) =>
		( {
			feature: {
				slug: 'forms',
				name: 'Forms',
				description: 'Build forms.',
				long_description: '',
				free_highlights: freeHighlights,
				paid_highlights: [],
				plans: [],
				upgrade: { path: '', name: '' },
			},
			status: 'active',
			control: { kind: 'none' },
		} ) as unknown as FeatureState;

	const renderModal = ( modalFeatureState: FeatureState ) =>
		render(
			<FeatureModal
				state={ modalFeatureState }
				position={ 1 }
				total={ 1 }
				onStep={ jest.fn() }
				onClose={ jest.fn() }
			/>
		);

	it( 'keeps Install, Upgrade and plans with a module note when the standalone plugin is missing', () => {
		const state = resolveFeatureState(
			{
				...feature,
				plugin: 'jetpack-search',
				plugin_status: 'not-installed',
				module: 'search',
				upgrade: { path: '/add-search', name: 'Search' },
			},
			'active',
			undefined,
			{
				search: {
					module: 'search',
					available: false,
					activated: false,
					unavailable_reason: 'Requires a Search plan',
				} as never,
			},
			{}
		);
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<FeatureModal
					state={ state }
					position={ 1 }
					total={ 1 }
					onStep={ jest.fn() }
					onClose={ jest.fn() }
				/>
			</QueryClientProvider>
		);
		expect( screen.getByRole( 'button', { name: 'Install' } ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'Upgrade to Search' } ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) ).toBeVisible();
		expect( screen.getByText( 'Jetpack module: Requires a Search plan' ) ).toBeVisible();
		expect( screen.getByText( 'Inactive' ) ).toBeVisible();
	} );

	it( 'leaves the header with only the title once the flag drops the status badge', () => {
		window.myJetpackInitialState.myJetpackFlags = {
			accountConnect: true,
		} as typeof window.myJetpackInitialState.myJetpackFlags;
		try {
			render(
				<QueryClientProvider client={ new QueryClient() }>
					<FeatureModal
						state={ moduleState( false, 'active' ) }
						position={ 1 }
						total={ 1 }
						onStep={ jest.fn() }
						onClose={ jest.fn() }
					/>
				</QueryClientProvider>
			);
			expect( screen.queryByText( /^(Active|Inactive)$/ ) ).not.toBeInTheDocument();
		} finally {
			window.myJetpackInitialState.myJetpackFlags = undefined;
		}
	} );

	it( 'shows the account reason once, outside the actions row', () => {
		window.myJetpackInitialState.myJetpackFlags = {
			accountConnect: true,
		} as typeof window.myJetpackInitialState.myJetpackFlags;
		try {
			const state = resolveFeatureState(
				{
					...feature,
					slug: 'jetpack-ai',
					name: 'Jetpack AI',
					product: 'jetpack-ai',
					needs_account: true,
					upgrade: { path: '/add-ai', name: 'Jetpack AI' },
				},
				'active',
				undefined,
				{
					ai: {
						module: 'ai',
						available: false,
						unavailable_reason: 'Requires a connected WordPress.com account',
						requires_user_connection: true,
						activated: false,
					} as never,
				},
				{},
				false,
				true
			);
			render(
				<QueryClientProvider client={ new QueryClient() }>
					<FeatureModal
						state={ state }
						position={ 1 }
						total={ 1 }
						onStep={ jest.fn() }
						onClose={ jest.fn() }
					/>
				</QueryClientProvider>
			);
			const reason = screen.getByText( 'Requires a connected WordPress.com account' );
			const upgrade = screen.getByRole( 'link', { name: 'Upgrade to Jetpack AI' } );
			// eslint-disable-next-line testing-library/no-node-access -- the actions row has no role to query.
			const actions = upgrade.closest( '[data-feature-actions]' );
			expect( reason ).toBeVisible();
			expect( actions ).not.toContainElement( reason );
		} finally {
			window.myJetpackInitialState.myJetpackFlags = undefined;
		}
	} );

	it( 'agrees with the card status for an unavailable feature with no standalone route', () => {
		const state = moduleState( false, 'inactive' );
		state.feature = { ...feature, plugin: '' };
		if ( state.control.kind === 'module' ) {
			state.control.module.available = false;
			state.control.module.unavailable_reason = 'A connection is required';
		}
		const view = render( <FeatureItem state={ state } onOpen={ jest.fn() } /> );
		expect( screen.getByText( 'Unavailable' ) ).toBeVisible();
		expect( screen.getByText( 'A connection is required' ) ).toBeVisible();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		view.unmount();
		renderModal( state );
		expect( screen.getByText( 'Unavailable' ) ).toBeVisible();
		expect( screen.getByText( 'A connection is required' ) ).toBeVisible();
		expect( screen.queryByRole( 'button', { name: /Activate/ } ) ).not.toBeInTheDocument();
	} );

	it.each( [ false, 'active' ] as const )(
		'offers no Install, Upgrade or plan links for multisite-blocked Backup with override %s',
		override => {
			const previous = window.JetpackScriptData;
			window.JetpackScriptData = { site: { is_multisite: true } } as typeof previous;
			try {
				const state = resolveFeatureState(
					{
						...feature,
						slug: 'backup',
						name: 'VaultPress Backup',
						module: 'backup',
						plugin: 'jetpack-backup',
						plugin_status: 'not-installed',
						upgrade: { path: '/add-backup', name: 'VaultPress Backup' },
					},
					'active',
					undefined,
					{ backup: { module: 'backup', available: true, activated: false, override } as never },
					{}
				);
				render(
					<QueryClientProvider client={ new QueryClient() }>
						<FeatureModal
							state={ state }
							position={ 1 }
							total={ 1 }
							onStep={ jest.fn() }
							onClose={ jest.fn() }
						/>
					</QueryClientProvider>
				);
				expect( screen.getByText( 'Not available on multisite' ) ).toBeVisible();
				expect( screen.queryByRole( 'button', { name: 'Install' } ) ).not.toBeInTheDocument();
				expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
				expect( screen.queryByText( /Included in/ ) ).not.toBeInTheDocument();
			} finally {
				window.JetpackScriptData = previous;
			}
		}
	);

	it( 'shows the Free column when the feature has free highlights', () => {
		renderModal( modalState( [ 'Unlimited forms' ] ) );

		expect( screen.getByRole( 'heading', { name: 'Free' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Unlimited forms' ) ).toBeInTheDocument();
	} );

	it( 'leaves out the Free column when the feature has no free highlights', () => {
		renderModal( modalState( [] ) );

		expect( screen.queryByRole( 'heading', { name: 'Free' } ) ).not.toBeInTheDocument();
	} );

	it( 'says how a feature sold without a plan is paid for, only when the catalog does', () => {
		const withNotes = modalState( [] );
		withNotes.feature.pricing_notes = [ 'No subscription required' ];
		const { unmount } = renderModal( withNotes );

		expect( screen.getByRole( 'heading', { name: 'How you pay' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'No subscription required' ) ).toBeInTheDocument();

		unmount();
		renderModal( modalState( [] ) );

		expect( screen.queryByRole( 'heading', { name: 'How you pay' } ) ).not.toBeInTheDocument();
	} );
} );
