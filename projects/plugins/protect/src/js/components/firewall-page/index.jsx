import { AdminSection, Container } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import AdminPage from '../admin-page';
import FirewallFooter from '../firewall-footer';
import FirewallHeader from '../firewall-header';

const FirewallPage = () => {
	const wafSeen = useSelect( select => select( STORE_ID ).getWafSeen() );
	const { setWafSeen } = useDispatch( STORE_ID );
	const { waf, wafIsFetching } = useWafData();

	let currentWafStatus;
	if ( wafIsFetching ) {
		currentWafStatus = 'loading';
	} else if ( waf ) {
		currentWafStatus = 'on';
	} else {
		currentWafStatus = 'off';
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
			<AdminSection>
				<Container></Container>
			</AdminSection>
			<FirewallFooter />
		</AdminPage>
	);
};

export default FirewallPage;
