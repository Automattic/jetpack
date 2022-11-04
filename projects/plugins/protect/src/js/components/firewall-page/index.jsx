import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallHeader from '../firewall-header';

const FirewallPage = () => {
	const wafSeen = useSelect( select => select( STORE_ID ).getWafSeen() );
	const { setWafSeen } = useDispatch( STORE_ID );

	useEffect( () => {
		if ( wafSeen ) {
			return;
		}

		// remove the "new" badge immediately
		setWafSeen( true );

		// update the meta value in the background
		apiFetch( {
			path: 'jetpack-protect/v1/waf-seen',
			method: 'POST',
		} );
	}, [ wafSeen, setWafSeen ] );

	return (
		<AdminPage>
			<FirewallHeader />
		</AdminPage>
	);
};

export default FirewallPage;
