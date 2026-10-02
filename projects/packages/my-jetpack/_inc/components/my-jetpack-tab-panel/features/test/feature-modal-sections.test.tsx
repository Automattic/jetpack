import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureDelivery } from '../feature-delivery';
import { FeatureModal } from '../feature-modal';
import { FeaturePaid, UpgradeButton } from '../feature-paid';
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

	it( 'links to the upgrade for a feature that sells on its own, returning to it after checkout', () => {
		render( <UpgradeButton state={ installedPlugin } /> );

		expect(
			screen.getByRole( 'link', { name: 'Upgrade to Jetpack Akismet Anti-spam' } )
		).toHaveAttribute( 'href', '#/add-akismet?return_feature=anti-spam' );
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
		render( <FeaturePaid state={ moduleState( false, 'inactive' ) } /> );

		await userEvent.click( screen.getByRole( 'link', { name: 'Jetpack Complete' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_features_plan_click', {
			feature: 'jetpack-forms',
			plan: 'complete',
		} );
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
