import { getSettings, setSettings } from '@wordpress/date';
import { startDateLabel } from '../subscriptions';
import type { PaidSubscription } from '../../../data/subscribers';

describe( 'startDateLabel', () => {
	it( 'reads WordPress.com’s zoneless date as UTC and shows it in the site timezone', () => {
		const settings = getSettings();
		setSettings( { ...settings, timezone: { ...settings.timezone, offset: 12, string: '' } } );
		try {
			expect( startDateLabel( { startDate: '2026-03-03 20:00:00' } as PaidSubscription ) ).toBe(
				'March 4, 2026'
			);
		} finally {
			setSettings( settings );
		}
	} );
} );
