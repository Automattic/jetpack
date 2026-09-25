import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectionHarness } from './helpers/selection-harness';
import type { FeatureState } from '../feature-state';
import type { ReactNode } from 'react';

const mockRun = jest.fn();

jest.mock( '../use-bulk-feature-switch', () => ( {
	...jest.requireActual( '../use-bulk-feature-switch' ),
	useBulkFeatureSwitch: () => ( { run: mockRun, isRunning: false } ),
} ) );

jest.mock( '../feature-item', () => ( {
	FeatureItem: ( { state, leading }: { state: FeatureState; leading: ReactNode } ) => (
		<div>
			{ leading }
			{ state.feature.name }
		</div>
	),
} ) );

const pluginState = ( slug: string, status: 'active' | 'inactive', overrides = {} ) =>
	( {
		feature: { slug, name: slug },
		status,
		control: { kind: 'plugin', plugin: slug },
		...overrides,
	} ) as FeatureState;

const akismet = pluginState( 'akismet', 'inactive' );
const boost = pluginState( 'boost', 'active' );
const crm = pluginState( 'crm', 'inactive', {
	control: { kind: 'install-plugin', plugin: 'crm' },
} );

const forcedStats = {
	feature: { slug: 'stats', name: 'stats' },
	status: 'active',
	control: {
		kind: 'module',
		module: { module: 'stats', available: true, activated: true, override: 'active' },
	},
} as FeatureState;

const checkbox = ( name: string ) => screen.getByRole( 'checkbox', { name } );
const button = ( name: string ) => screen.getByRole( 'button', { name } );
// @wordpress/ui buttons stay focusable when disabled, so they carry aria-disabled instead.
const isDisabled = ( name: string ) => button( name ).getAttribute( 'aria-disabled' ) === 'true';

beforeEach( () => {
	mockRun.mockReset();
	mockRun.mockResolvedValue( [] );
} );

describe( 'FeatureList with the shared selection', () => {
	it( 'selects every switchable row, and only those, from the select-all box', async () => {
		render( <SelectionHarness states={ [ akismet, boost, crm ] } /> );

		await userEvent.click( checkbox( 'Select all features' ) );

		expect( checkbox( 'Select akismet' ) ).toBeChecked();
		expect( checkbox( 'Select boost' ) ).toBeChecked();
		expect( checkbox( 'Select crm' ) ).not.toBeChecked();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '2 selected' );
	} );

	it( 'offers no checkbox for a module a host forced on or off', async () => {
		render( <SelectionHarness states={ [ akismet, forcedStats ] } /> );

		expect( screen.queryByRole( 'checkbox', { name: 'Select stats' } ) ).not.toBeInTheDocument();

		await userEvent.click( checkbox( 'Select all features' ) );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1 selected' );
	} );

	it( 'offers no checkbox for a plugin a host forced on or off', async () => {
		const forcedBoost = pluginState( 'boost', 'active', {
			control: { kind: 'plugin', plugin: 'boost', override: 'active' },
		} );
		render( <SelectionHarness states={ [ akismet, forcedBoost ] } /> );

		expect( screen.queryByRole( 'checkbox', { name: 'Select boost' } ) ).not.toBeInTheDocument();

		await userEvent.click( checkbox( 'Select all features' ) );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '1 selected' );
	} );

	it( 'shows select-all as partly checked when only some rows are picked', async () => {
		render( <SelectionHarness states={ [ akismet, boost ] } /> );

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( checkbox( 'Select all features' ) ).toHaveProperty( 'indeterminate', true );
	} );

	it( 'explains a row that cannot be picked', () => {
		render( <SelectionHarness states={ [ crm ] } /> );

		expect( checkbox( 'Select crm' ) ).toBeDisabled();
		expect( checkbox( 'Select crm' ) ).toHaveAccessibleDescription(
			'Change this feature from its own control.'
		);
	} );

	it( 'offers only the action the selection can use, and clears the selection after it', async () => {
		render( <SelectionHarness states={ [ akismet, boost ] } /> );

		expect( isDisabled( 'Activate' ) ).toBe( true );

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( isDisabled( 'Activate' ) ).toBe( false );
		expect( isDisabled( 'Deactivate' ) ).toBe( true );

		await userEvent.click( button( 'Activate' ) );

		expect( mockRun ).toHaveBeenCalledWith( [ akismet ], true );
		await waitFor( () => expect( checkbox( 'Select akismet' ) ).not.toBeChecked() );
	} );

	it( 'holds the bar while any row still has a switch in flight', async () => {
		render( <SelectionHarness states={ [ akismet, { ...boost, isSwitching: true } ] } /> );

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( isDisabled( 'Activate' ) ).toBe( true );
		expect( checkbox( 'Select all features' ) ).toBeDisabled();
	} );

	it( 'keeps the features that failed selected, for a retry', async () => {
		mockRun.mockResolvedValue( [ 'akismet' ] );
		render(
			<SelectionHarness states={ [ akismet, pluginState( 'jetpack-search', 'inactive' ) ] } />
		);

		await userEvent.click( checkbox( 'Select akismet' ) );
		await userEvent.click( checkbox( 'Select jetpack-search' ) );
		await userEvent.click( button( 'Activate' ) );

		await waitFor( () => expect( checkbox( 'Select jetpack-search' ) ).not.toBeChecked() );
		expect( checkbox( 'Select akismet' ) ).toBeChecked();
	} );

	it( 'holds plugins out of a bulk Deactivate while Jetpack is inactive, and says why', async () => {
		render( <SelectionHarness states={ [ boost ] } canDeactivatePlugins={ false } /> );

		await userEvent.click( checkbox( 'Select boost' ) );

		expect( isDisabled( 'Deactivate' ) ).toBe( true );
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Plugins can only be deactivated together while the Jetpack plugin is active.'
		);
	} );
} );
