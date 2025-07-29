import { AdminPage } from '@automattic/jetpack-components';
import { getJetpackAdminPageUrl, getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { FC } from 'react';

const ConnectionScreen: FC = () => {
	const redirectUrl = addQueryArgs( getJetpackAdminPageUrl(), {
		connect_url_redirect: 1,
		redirect_after_auth: getMyJetpackUrl(),
	} );

	useEffect(() => {
		window.location.replace( redirectUrl );
	}, []);

	return (
		<AdminPage showBackground={ false } showFooter={ false }>
			<div style={ { marginInline: '1.5rem' } }>{ __( 'Redirecting…', 'jetpack-my-jetpack' ) }</div>
		</AdminPage>
	);
};

export default ConnectionScreen;
