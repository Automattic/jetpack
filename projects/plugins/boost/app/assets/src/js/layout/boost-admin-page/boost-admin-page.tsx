import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';

type BoostAdminPageProps = {
	children: ReactNode;
};

const BoostAdminPage = ( { children }: BoostAdminPageProps ) => {
	return (
		<AdminPage
			title="Boost" /** "Boost" is a product name, do not translate. */
			subTitle={ __( 'Optimize your site performance and loading speed.', 'jetpack-boost' ) }
			showBackground={ false }
		>
			{ children }
		</AdminPage>
	);
};

export default BoostAdminPage;
