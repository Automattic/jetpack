import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../../hooks/use-analytics';
import { FeatureInspector } from '../feature-inspector';
import type { FeatureState } from '../feature-state';

const recordEvent = jest.fn();
let mockMain = { jetpack: 'active', features: [ { slug: 'boost' } ], isPlaceholderData: false };
let mockStates: FeatureState[] = [];

jest.mock( '../../../../hooks/use-analytics' );
jest.mock( '../../../../utils/reload-page', () => ( {
	reloadPage: jest.fn(),
	leavePageFor: jest.fn(),
} ) );
jest.mock( '../use-main-features', () => ( {
	useMainFeatures: () => mockMain,
	useFeaturePlugin: () => ( { run: () => Promise.resolve( true ), isBusy: false } ),
	useInstallError: () => null,
} ) );
jest.mock( '../feature-state', () => ( {
	...jest.requireActual( '../feature-state' ),
	useFeatureStates: () => ( { states: mockStates, isLoading: false } ),
	useAccountConnected: () => false,
	getForcedReason: () => null,
} ) );
jest.mock( '../../../module-toggle', () => ( {
	ModuleToggle: () => null,
	useModuleActivation: () => ( { setModuleActive: jest.fn(), isUpdating: false, isActive: false } ),
} ) );

const boost = {
	feature: {
		slug: 'boost',
		name: 'Boost',
		description: '',
		plans: [],
		plugin: 'jetpack-boost',
		plugin_name: 'Jetpack Boost',
		plugin_status: 'inactive',
	},
	status: 'inactive',
	control: { kind: 'install-plugin', plugin: 'jetpack-boost' },
} as unknown as FeatureState;

beforeEach( () => {
	jest.clearAllMocks();
	( useAnalytics as jest.Mock ).mockReturnValue( { recordEvent } );
	mockStates = [ boost ];
} );

describe( 'FeatureInspector', () => {
	it.each( [
		[ 'closes for a slug the site does not have', [ { slug: 'boost' } ], false, 1 ],
		[ 'waits while the list is still an empty placeholder', [], true, 0 ],
	] )( '%s', ( _, features, isPlaceholderData, closes ) => {
		mockMain = { jetpack: 'active', features, isPlaceholderData };
		mockStates = [];
		const onClose = jest.fn();

		render(
			<FeatureInspector slug="retired" searchParams={ new URLSearchParams() } onClose={ onClose } />
		);

		expect( onClose ).toHaveBeenCalledTimes( closes );
	} );

	it( 'records its actions against the grid beside it', async () => {
		render(
			<FeatureInspector
				slug="boost"
				searchParams={ new URLSearchParams( 'view=list&filter=available' ) }
				onClose={ jest.fn() }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_feature_action',
			expect.objectContaining( {
				action: 'install',
				feature_slug: 'boost',
				current_filter: 'available',
				view: 'list',
			} )
		);
	} );

	it( 'takes focus, closes on Escape, and hands focus back to the card that opened it', async () => {
		const card = document.createElement( 'button' );
		document.body.append( card );
		card.focus();
		const onClose = jest.fn();

		const { unmount } = render(
			<FeatureInspector slug="boost" searchParams={ new URLSearchParams() } onClose={ onClose } />
		);

		expect( screen.getByRole( 'heading', { level: 2, name: 'Boost' } ) ).toHaveFocus();
		await userEvent.keyboard( '{Escape}' );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
		unmount();
		expect( card ).toHaveFocus();
		card.remove();
	} );
} );
