import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FirewallSettingsCard from '../settings-card';
import type { WafConfig } from '../../../data/use-protect-settings';
import type { FirewallContext } from '../types';

const WAF_PATH = '/jetpack/v4/waf';

const BOOTSTRAP_PATH = '/var/www/wp-content/jetpack-waf/bootstrap.php';

const setup = ( settings: Record< string, boolean >, waf: WafConfig = {} ) => {
	const save = jest.fn().mockResolvedValue( true );
	render(
		<FirewallSettingsCard
			{ ...( {
				state: { hasScan: true },
				settings: { settings: { waf: true, ...settings }, waf, save, isSaving: () => false },
			} as unknown as FirewallContext ) }
		/>
	);
	return save;
};

describe( 'FirewallSettingsCard', () => {
	// Detailed sharing depends on basic sharing, and only the WAF endpoint rebuilds the standalone bootstrap.
	it.each( [
		[
			'turning basic sharing off also turns detailed sharing off',
			{ jetpack_waf_share_data: true, jetpack_waf_share_debug_data: true },
			'Share basic data with Jetpack',
			{ jetpack_waf_share_data: false, jetpack_waf_share_debug_data: false },
		],
		[
			'turning detailed sharing on also turns basic sharing on',
			{ jetpack_waf_share_data: false, jetpack_waf_share_debug_data: false },
			'Share detailed data with Jetpack',
			{ jetpack_waf_share_debug_data: true, jetpack_waf_share_data: true },
		],
		[
			'turning detailed sharing off leaves basic sharing alone',
			{ jetpack_waf_share_data: true, jetpack_waf_share_debug_data: true },
			'Share detailed data with Jetpack',
			{ jetpack_waf_share_debug_data: false },
		],
	] )( '%s', async ( _name, settings, label, payload ) => {
		const save = setup( settings );

		await userEvent.click( screen.getByRole( 'checkbox', { name: label } ) );

		expect( save ).toHaveBeenCalledWith( payload, WAF_PATH );
	} );

	// The badge and the row's heading share the label, so the count tells which of them show.
	it.each( [
		[
			'shows the setup steps',
			true,
			{ bootstrap_path: BOOTSTRAP_PATH, standalone_mode: false },
			1,
			true,
		],
		[
			'shows the badge and how to undo it',
			true,
			{ bootstrap_path: BOOTSTRAP_PATH, standalone_mode: true },
			2,
			false,
		],
		[
			'hides with the firewall off',
			false,
			{ bootstrap_path: BOOTSTRAP_PATH, standalone_mode: true },
			0,
			false,
		],
		[ 'hides without a bootstrap path', true, { standalone_mode: false }, 0, false ],
	] )( 'standalone mode %s', ( _name, wafOn, waf, labels, showsPath ) => {
		setup( { waf: wafOn }, waf );

		expect( screen.queryAllByText( 'Standalone mode' ) ).toHaveLength( labels );
		expect( screen.queryByText( BOOTSTRAP_PATH, { exact: false } ) !== null ).toBe( showsPath );
	} );

	it.each( [
		[ true, /Your host provides a firewall/ ],
		[ false, /isn’t available on your site’s hosting/ ],
	] )(
		'offers no settings where Jetpack’s firewall can’t run (host firewall: %s)',
		( providedByHost, message ) => {
			render(
				<FirewallSettingsCard
					{ ...( {
						state: { providedByHost },
						settings: {
							settings: {},
							waf: { waf_supported: false },
							save: jest.fn(),
							isSaving: () => false,
						},
					} as unknown as FirewallContext ) }
				/>
			);

			expect( screen.getByText( message ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
		}
	);
} );
