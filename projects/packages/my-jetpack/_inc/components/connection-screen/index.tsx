import { AdminPage } from '@automattic/jetpack-components';
import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, type FC } from 'react';
import styles from './styles.module.scss';

const ConnectionScreen: FC = () => {
	useEffect( () => {
		const redirectUrl = addQueryArgs( getJetpackAdminPageUrl(), {
			connect_url_redirect: 1,
			redirect_after_auth: getMyJetpackUrl(),
		} );

		window.location.replace( redirectUrl );
	}, [] );

	return (
		<AdminPage showBackground={ false } showFooter={ false }>
			<div className={ styles[ 'redirect-block' ] }>
				{ __( 'Redirecting…', 'jetpack-my-jetpack' ) }
			</div>
		</AdminPage>
	);
};

export default ConnectionScreen;
