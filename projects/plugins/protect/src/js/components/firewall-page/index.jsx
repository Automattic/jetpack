import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallHeader from '../firewall-header';

const FirewallPage = () => {
	const wafSeen = useSelect( select => select( STORE_ID ).getWafSeen() );
	const { setWafSeen } = useDispatch( STORE_ID );
	const { moduleIsEnabled } = useWafData();

	let currentWafStatus;
	switch ( moduleIsEnabled ) {
		case true:
			currentWafStatus = 'on';
			break;
		case false:
			currentWafStatus = 'off';
			break;
		default:
			currentWafStatus = 'loading';
	}

	const { hasRequiredPlan } = useProtectData();

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
			<FirewallHeader status={ currentWafStatus } hasRequiredPlan={ hasRequiredPlan } />
		</AdminPage>
	);
};

export default FirewallPage;
