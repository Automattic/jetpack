import { AdminPage as JetpackAdminPage } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import useNotices from '../../hooks/use-notices';
import useProtectData from '../../hooks/use-protect-data';
import Notice from '../notice';

/**
 * Resolve the active tab value from the current pathname.
 *
 * Matches '/firewall' and '/settings' exactly or as path prefixes (so future
 * nested routes like '/settings/foo' still select the right tab) without
 * over-matching unrelated paths like '/firewall-extras'.
 *
 * @param {string} pathname - The current location pathname.
 * @return {string} The active tab value ('scan' | 'firewall' | 'settings').
 */
function getActiveTab( pathname ) {
	if ( pathname === '/firewall' || pathname.startsWith( '/firewall/' ) ) {
		return 'firewall';
	}
	if ( pathname === '/settings' || pathname.startsWith( '/settings/' ) ) {
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

	// Reset scroll position whenever the active tab changes. The actual scroll
	// container is the layout mixin's `overflow: auto` direct child of
	// `.admin-ui-page` (a wrapper applied by `<AdminPage>` around `children`),
	// not `Tabs.Root` itself. Walk up from Tabs.Root to find that ancestor so
	// this stays robust to any future restructuring of `<AdminPage>`.
	const tabsRootRef = useRef( null );
	useEffect( () => {
		let el = tabsRootRef.current?.parentElement;
		while ( el && el !== document.body ) {
			const { overflowY } = window.getComputedStyle( el );
			if ( overflowY === 'auto' || overflowY === 'scroll' ) {
				el.scrollTo( { top: 0 } );
				break;
			}
			el = el.parentElement;
		}
	}, [ activeTab ] );

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
			<Tabs.Root ref={ tabsRootRef } value={ activeTab } onValueChange={ onValueChange }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="scan">{ scanLabel }</Tabs.Tab>
						<Tabs.Tab value="firewall">{ __( 'Firewall', 'jetpack-protect' ) }</Tabs.Tab>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-protect' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				{ /* Every tab panel shares the same react-router <Outlet />, which always
				     renders the active route. Tabs.Panel (via @base-ui/react) keeps the
				     outgoing panel mounted until its close transition completes, so
				     rendering the Outlet unconditionally would duplicate the active route's
				     content into any panel still mounted during a tab transition (a
				     transient, hidden + inert copy — including duplicate element ids). Gate
				     each Outlet on the active tab so the matched route renders exactly once. */ }
				<Tabs.Panel value="scan">{ activeTab === 'scan' && <Outlet /> }</Tabs.Panel>
				<Tabs.Panel value="firewall">{ activeTab === 'firewall' && <Outlet /> }</Tabs.Panel>
				<Tabs.Panel value="settings">{ activeTab === 'settings' && <Outlet /> }</Tabs.Panel>
			</Tabs.Root>
		</JetpackAdminPage>
	);
};

export default ProtectApp;
