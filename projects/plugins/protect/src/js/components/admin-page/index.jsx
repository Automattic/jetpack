import { AdminPage as JetpackAdminPage, Container } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotices from '../../hooks/use-notices';
import useWafData from '../../hooks/use-waf-data';
import Logo from '../logo';
import Notice from '../notice';
import Tabs, { Tab } from '../tabs';
import styles from './styles.module.scss';

const AdminPage = ( { children } ) => {
	const { notice } = useNotices();
	const { isRegistered } = useConnection();
	const { isSeen: wafSeen } = useWafData();
	const navigate = useNavigate();

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
		<JetpackAdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> }>
			{ notice && <Notice floating={ true } dismissable={ true } { ...notice } /> }
			<Container horizontalSpacing={ 0 }>
				<Tabs className={ styles.navigation }>
					<Tab link="/scan" label={ __( 'Scan', 'jetpack-protect' ) } />
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
