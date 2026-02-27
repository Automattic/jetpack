import { AdminPage as JetpackAdminPage } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useNotices from '../../hooks/use-notices';
import useProtectData from '../../hooks/use-protect-data';
import Notice from '../notice';
import Tabs, { Tab } from '../tabs';
import styles from './styles.module.scss';

const AdminPage = ( { children } ) => {
	const { notice } = useNotices();
	const { isRegistered } = useConnection();
	const navigate = useNavigate();
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

	if ( ! isRegistered ) {
		return null;
	}

	return (
		<JetpackAdminPage
			moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }
			title={ __( 'Protect', 'jetpack-protect' ) }
			subTitle={ __( 'Automated malware scanning and firewall protection.', 'jetpack-protect' ) }
			tabs={
				<Tabs>
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
						label={ <span className={ styles.tab }>{ __( 'Firewall', 'jetpack-protect' ) }</span> }
					/>
					<Tab
						link="/settings"
						label={ <span className={ styles.tab }>{ __( 'Settings', 'jetpack-protect' ) }</span> }
					/>
				</Tabs>
			}
		>
			{ notice && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			{ children }
		</JetpackAdminPage>
	);
};

export default AdminPage;
