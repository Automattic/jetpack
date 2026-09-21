import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureList } from '../feature-list';
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

const checkbox = ( name: string ) => screen.getByRole( 'checkbox', { name } );
const button = ( name: string ) => screen.getByRole( 'button', { name } );
// @wordpress/ui buttons stay focusable when disabled, so they carry aria-disabled instead.
const isDisabled = ( name: string ) => button( name ).getAttribute( 'aria-disabled' ) === 'true';

beforeEach( () => {
	mockRun.mockReset();
	mockRun.mockResolvedValue( undefined );
} );

describe( 'FeatureList', () => {
	it( 'selects every switchable row, and only those, from the select-all box', async () => {
		render( <FeatureList states={ [ akismet, boost, crm ] } onOpen={ jest.fn() } /> );

		await userEvent.click( checkbox( 'Select all features' ) );

		expect( checkbox( 'Select akismet' ) ).toBeChecked();
		expect( checkbox( 'Select boost' ) ).toBeChecked();
		expect( checkbox( 'Select crm' ) ).not.toBeChecked();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( '2 selected' );
	} );

	it( 'shows select-all as partly checked when only some rows are picked', async () => {
		render( <FeatureList states={ [ akismet, boost ] } onOpen={ jest.fn() } /> );

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( checkbox( 'Select all features' ) ).toHaveProperty( 'indeterminate', true );
	} );

	it( 'explains a row that cannot be picked', () => {
		render( <FeatureList states={ [ crm ] } onOpen={ jest.fn() } /> );

		expect( checkbox( 'Select crm' ) ).toBeDisabled();
		expect( checkbox( 'Select crm' ) ).toHaveAccessibleDescription(
			'Change this feature from its own control.'
		);
	} );

	it( 'offers only the action the selection can use, and clears the selection after it', async () => {
		render( <FeatureList states={ [ akismet, boost ] } onOpen={ jest.fn() } /> );

		expect( isDisabled( 'Activate' ) ).toBe( true );

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( isDisabled( 'Activate' ) ).toBe( false );
		expect( isDisabled( 'Deactivate' ) ).toBe( true );

		await userEvent.click( button( 'Activate' ) );

		expect( mockRun ).toHaveBeenCalledWith( [ akismet ], true );
		await waitFor( () => expect( checkbox( 'Select akismet' ) ).not.toBeChecked() );
	} );

	it( 'holds the bar while any row still has a switch in flight', async () => {
		render(
			<FeatureList states={ [ akismet, { ...boost, isSwitching: true } ] } onOpen={ jest.fn() } />
		);

		await userEvent.click( checkbox( 'Select akismet' ) );

		expect( isDisabled( 'Activate' ) ).toBe( true );
		expect( checkbox( 'Select all features' ) ).toBeDisabled();
	} );
} );
