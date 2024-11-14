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
import useNotices from '../../hooks/use-notices';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
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
	const {
		counts: {
			current: { threats: numThreats },
		},
	} = useProtectData();
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
							<Button variant="secondary" weight={ 'regular' } href={ goToCloudUrl }>
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
					<Tab
						link="/scan"
						label={
							<span className={ styles.tab }>
								{ numThreats > 0
									? sprintf(
											// translators: %d is the number of threats found.
											__( 'Scan (%d)', 'jetpack-protect' ),
											numThreats
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
