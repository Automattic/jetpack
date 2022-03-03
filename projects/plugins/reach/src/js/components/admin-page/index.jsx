/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Admin = () => {
	return (
		<AdminPage moduleName={ __( 'Jetpack Reach', 'jetpack-reach' ) }>
			<AdminSectionHero>
				<Container horizontalSpacing={ 5 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 7 } lg={ 6 }>
						<h1 className={ styles.heading }>
							{ __( 'Social Media Automation for WordPress Sites', 'jetpack-reach' ) }
						</h1>
					</Col>
				</Container>
				<Container horizontalSpacing={ 5 } horizontalGap={ 3 }>
					<Col sm={ 4 } md={ 7 } lg={ 6 }>
						<PricingCard
							title={ __( 'Jetpack Reach', 'jetpack-reach' ) }
							priceBefore={ 9 }
							priceAfter={ 4.5 }
							ctaText={ __( 'Get Jetpack Reach', 'jetpack-reach' ) }
							infoText={ __(
								'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
								'jetpack-reach'
							) }
						/>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;
