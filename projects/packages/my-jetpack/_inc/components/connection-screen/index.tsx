import { AdminPage } from '@automattic/jetpack-components';
import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { Flex, Spinner } from '@wordpress/components';
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
				<Flex justify="start">
					<Spinner style={ { margin: 0 } } />
					{ __( 'Redirecting…', 'jetpack-my-jetpack' ) }
				</Flex>
			</div>
		</AdminPage>
	);
};

export default ConnectionScreen;
