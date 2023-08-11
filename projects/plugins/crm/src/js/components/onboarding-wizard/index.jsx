import { AdminSectionHero, Container, Col, PricingCard } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import AdminPage from '../admin-page';
import styles from './styles.module.scss';

const OnboardingWizard = () => {
	return (
		<AdminPage moduleName={ __( 'Jetpack CRM', 'zero-bs-crm' ) }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<div id="jp-admin-notices" className="jetpack-crm-jitm-card" />
					</Col>
					<Col sm={ 4 } md={ 6 } lg={ 6 }>
						<h1 className={ styles.heading }>{ __( 'Jetpack CRM', 'zero-bs-crm' ) }</h1>
						<ul className={ styles[ 'jp-product-promote' ] }>
							<li>{ __( 'Expanded import opportunities.', 'zero-bs-crm' ) }</li>
							<li>{ __( 'Automations.', 'zero-bs-crm' ) }</li>
							<li>{ __( 'Advanced segments.', 'zero-bs-crm' ) }</li>
							<li>{ __( 'Much, much more…', 'zero-bs-crm' ) }</li>
						</ul>
					</Col>
					<Col sm={ 0 } md={ 1 } lg={ 1 } />
					<Col sm={ 4 } md={ 5 } lg={ 5 }>
						<PricingCard
							title={ __( 'Entrepreneur Plan', 'zero-bs-crm' ) }
							priceBefore={ 17 }
							priceAfter={ 9.95 }
							ctaText={ __( 'Buy now', 'zero-bs-crm' ) }
							infoText={ __(
								'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
								'zero-bs-crm'
							) }
						/>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default OnboardingWizard;
