import { reloadPage } from '../../../../utils/reload-page';
import { CONNECT_INTENT_STORAGE_KEY, reloadToTurnOn } from '../connect-resume';

jest.mock( '../../../../utils/reload-page', () => ( {
	reloadPage: jest.fn(),
	leavePageFor: jest.fn(),
} ) );

describe( 'reloadToTurnOn', () => {
	it( 'reloads to the Features view it was clicked in, read from the boot router', () => {
		const route = encodeURIComponent( '/features?feature=activity-log&view=list' );
		window.history.replaceState( null, '', `/wp-admin/admin.php?page=my-jetpack&p=${ route }` );

		reloadToTurnOn( 'activity-log' );

		const { id } = JSON.parse(
			window.sessionStorage.getItem( CONNECT_INTENT_STORAGE_KEY ) ?? '{}'
		);
		expect( window.location.hash ).toBe(
			`#/features?feature=activity-log&view=list&connect_intent=${ id }`
		);
		expect( reloadPage ).toHaveBeenCalledTimes( 1 );
	} );
} );
