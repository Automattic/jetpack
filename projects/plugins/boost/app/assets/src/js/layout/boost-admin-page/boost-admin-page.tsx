import { AdminPage } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isWoaHosting } from '$lib/utils/hosting';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import type { ReactNode } from 'react';

type BoostAdminPageProps = {
	children: ReactNode;
	showActivateLicense?: boolean;
	breadcrumbs?: ReactNode;
};

const BoostAdminPage = ( {
	children,
	showActivateLicense = true,
	breadcrumbs,
}: BoostAdminPageProps ) => {
	const activateLicenseUrl = 'admin.php?page=my-jetpack#/add-license';
	const premiumFeatures = usePremiumFeatures();
	const hasPlan = premiumFeatures && premiumFeatures.length > 0;

	const licenseAction =
		showActivateLicense && ! isWoaHosting() && ! hasPlan ? (
			<Button variant="secondary" href={ activateLicenseUrl }>
				{ __( 'Use license key', 'jetpack-boost' ) }
			</Button>
		) : undefined;

	return (
		<AdminPage
			title={
				breadcrumbs ? undefined : 'Boost' /** "Boost" is a product name, do not translate. */
			}
			subTitle={
				breadcrumbs
					? undefined
					: __( 'Optimize your site performance and loading speed.', 'jetpack-boost' )
			}
			breadcrumbs={ breadcrumbs }
			actions={ licenseAction }
			showFooter={ false }
			showBackground={ false }
		>
			{ children }
		</AdminPage>
	);
};

export default BoostAdminPage;
