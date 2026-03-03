import {
	AdminPage as JetpackAdminPage,
	AdminSectionHero,
	Col,
	Container,
	Text,
} from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ConnectedPricingTable from '../../components/pricing-table';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import styles from './styles.module.scss';

const ACTIVATE_LICENSE_URL = 'admin.php?page=my-jetpack#/add-license';

const SetupRoute = () => {
	// Track view for Protect WAF page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_interstitial',
	} );

	return (
		<JetpackAdminPage
			title={ 'Protect' /** "Protect" is a product name, do not translate. */ }
			subTitle={ __( 'Automated malware scanning and firewall protection.', 'jetpack-protect' ) }
			actions={
				<Text variant="body-small" className={ styles[ 'mobile-action-container' ] }>
					{ createInterpolateElement(
						__(
							'Already have an existing plan or license key? <a>Click here to get started</a>',
							'jetpack-protect'
						),
						{
							a: <a href={ ACTIVATE_LICENSE_URL } />,
						}
					) }
				</Text>
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
