import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import ConnectedPricingTable from '../../components/pricing-table';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';

const ACTIVATE_LICENSE_URL = 'admin.php?page=my-jetpack#/add-license';

const SetupRoute = () => {
	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_interstitial',
	} );

	return (
		<JetpackAdminPage
			title={ 'Protect' /** "Protect" is a product name, do not translate. */ }
			subTitle={
				<>
					{ __( 'Automated malware scanning and firewall protection.', 'jetpack-protect' ) }{ ' ' }
					<a href={ ACTIVATE_LICENSE_URL }>{ __( 'Activate your license', 'jetpack-protect' ) }</a>
				</>
			}
		>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 8 } lg={ 12 }>
						<ConnectedPricingTable />
					</Col>
				</Container>
			</AdminSectionHero>
		</JetpackAdminPage>
	);
};

export default SetupRoute;
