import {
	AdminPage as JetpackAdminPage,
	Container,
	JetpackProtectLogo,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
			header={ <JetpackProtectLogo /> }
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
					<Tab link="/firewall" label={ __( 'Firewall', 'jetpack-protect' ) } />
				</Tabs>
			</Container>
			{ children }
		</JetpackAdminPage>
	);
};

export default AdminPage;
