import { AdminPage as JetpackAdminPage } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useCallback, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import useNotices from '../../hooks/use-notices';
import useProtectData from '../../hooks/use-protect-data';
import Notice from '../notice';

/**
 * Resolve the active tab value from the current pathname.
 *
 * @param {string} pathname - The current location pathname.
 * @return {string} The active tab value ('scan' | 'firewall' | 'settings').
 */
function getActiveTab( pathname ) {
	if ( pathname.startsWith( '/firewall' ) ) {
		return 'firewall';
	}
	if ( pathname.startsWith( '/settings' ) ) {
		return 'settings';
	}
	// Default (covers '/scan', '/scan/history', '/scan/history/:filter' and any unmatched path).
	return 'scan';
}

const ProtectApp = () => {
	const { notice } = useNotices();
	const { isRegistered } = useConnection();
	const navigate = useNavigate();
	const location = useLocation();
	const {
		counts: {
			current: { threats: numThreats },
		},
	} = useProtectData();

	// Redirect to the setup page if the site is not registered.
	useEffect( () => {
		if ( ! isRegistered ) {
			navigate( '/setup' );
		}
	}, [ isRegistered, navigate ] );

	const activeTab = useMemo( () => getActiveTab( location.pathname ), [ location.pathname ] );

	const onValueChange = useCallback(
		value => {
			navigate( `/${ value }` );
		},
		[ navigate ]
	);

	if ( ! isRegistered ) {
		return null;
	}

	const scanLabel =
		numThreats > 0
			? sprintf(
					// translators: %d is the number of threats found.
					__( 'Scan (%d)', 'jetpack-protect' ),
					numThreats
			  )
			: __( 'Scan', 'jetpack-protect' );

	return (
		<JetpackAdminPage
			title={ 'Protect' /** "Protect" is a product name, do not translate. */ }
			subTitle={ __( 'Automated malware scanning and firewall protection.', 'jetpack-protect' ) }
		>
			{ notice && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<Tabs.Root value={ activeTab } onValueChange={ onValueChange }>
				<Tabs.List>
					<Tabs.Tab value="scan">{ scanLabel }</Tabs.Tab>
					<Tabs.Tab value="firewall">{ __( 'Firewall', 'jetpack-protect' ) }</Tabs.Tab>
					<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-protect' ) }</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="scan">
					<Outlet />
				</Tabs.Panel>
				<Tabs.Panel value="firewall">
					<Outlet />
				</Tabs.Panel>
				<Tabs.Panel value="settings">
					<Outlet />
				</Tabs.Panel>
			</Tabs.Root>
		</JetpackAdminPage>
	);
};

export default ProtectApp;
