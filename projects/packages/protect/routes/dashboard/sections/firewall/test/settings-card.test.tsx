import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FirewallSettingsCard from '../settings-card';
import type { FirewallContext } from '../types';

const WAF_PATH = '/jetpack/v4/waf';

const setup = ( settings: Record< string, boolean > ) => {
	const save = jest.fn().mockResolvedValue( true );
	render(
		<FirewallSettingsCard
			{ ...( {
				state: { hasScan: true },
				settings: { settings: { waf: true, ...settings }, waf: {}, save, isSaving: () => false },
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
} );
