import { OVERVIEW_UPGRADE_EVENT } from './upgrade-bridge';

test( 'exports the event name used to mount the Overview upgrade slot', () => {
	expect( OVERVIEW_UPGRADE_EVENT ).toBe( 'jetpack-boost:mount-overview-upgrade' );
} );
