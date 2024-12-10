import {
	AdminPage as JetpackAdminPage,
	Button,
	Container,
	getRedirectUrl,
	JetpackProtectLogo,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useNotices from '../../hooks/use-notices';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import Notice from '../notice';
import ScanButton from '../scan-button';
import Tabs, { Tab } from '../tabs';
import styles from './styles.module.scss';

const AdminPage = ( { children } ) => {
	const { notice } = useNotices();
	const { isRegistered } = useConnection();
	const { isSeen: wafSeen } = useWafData();
	const navigate = useNavigate();
	const { data: status } = useScanStatusQuery();
	const location = useLocation();
	const { hasPlan } = usePlan();

	// Redirect to the setup page if the site is not registered.
	useEffect( () => {
		if ( ! isRegistered ) {
			navigate( '/setup' );
		}
	}, [ isRegistered, navigate ] );

	if ( ! isRegistered ) {
		return null;
	}

	const viewingScanPage = location.pathname.includes( '/scan' );

	const { siteSuffix, blogID } = window.jetpackProtectInitialState || {};
	const goToCloudUrl = getRedirectUrl( 'jetpack-scan-dash', { site: blogID ?? siteSuffix } );

	return (
		<JetpackAdminPage
			moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
			header={
				<div className={ styles.header }>
					<JetpackProtectLogo />
					{ hasPlan && viewingScanPage && (
						<div className={ styles.header__scan_buttons }>
							<Button variant="link" isExternalLink weight={ 'regular' } href={ goToCloudUrl }>
								{ __( 'Go to Cloud', 'jetpack-protect' ) }
							</Button>
							<ScanButton />
						</div>
					) }
				</div>
			}
		>
			{ notice && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<Container horizontalSpacing={ 0 }>
				<Tabs className={ styles.navigation }>
					<Tab link="/" label={ __( 'Home', 'jetpack-protect' ) } />
					<Tab
						link="/scan"
						label={
							<span className={ styles.tab }>
								{ status.threats.length > 0
									? sprintf(
											// translators: %d is the number of threats found.
											__( 'Scan (%d)', 'jetpack-protect' ),
											status.threats.length
									  )
									: __( 'Scan', 'jetpack-protect' ) }
							</span>
						}
					/>
					<Tab
						link="/firewall"
						label={
							<>
								{ __( 'Firewall', 'jetpack-protect' ) }
								{ wafSeen === false && (
									<span className={ styles.badge }>{ __( 'New', 'jetpack-protect' ) }</span>
								) }
							</>
						}
					/>
				</Tabs>
			</Container>
			{ children }
		</JetpackAdminPage>
	);
};

export default AdminPage;
