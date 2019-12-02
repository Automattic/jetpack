/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { moment, translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import ProductCard from '../components/product-card';
import { SingleProductBackup } from './single-product-backup';
import { getPlanClass } from '../lib/plans/constants';
import {
	getActiveSitePurchases,
	getAvailablePlans,
	getSitePlan,
	isFetchingSiteData,
} from '../state/site';
import { getSiteRawUrl, getUpgradeUrl, isMultisite } from '../state/initial-state';
import { getProducts, isFetchingProducts } from '../state/products';

class ProductSelector extends Component {
	getProductCardPropsForPurchase( purchase ) {
		const { siteRawlUrl } = this.props;

		const planClass = getPlanClass( purchase.product_slug );

		// TODO: Move out those somewhere else to make this a flexible and fully reusable component.
		const dailyBackupTitle = __( 'Jetpack Backup {{em}}Daily{{/em}}', {
			components: {
				em: <em />,
			},
		} );

		const realTimeBackupTitle = __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
			components: {
				em: <em />,
			},
		} );

		const purchasedDate = __( 'Purchased on %(purchaseDate)s', {
			args: {
				purchaseDate: moment( purchase.subscribedDate ).format( 'LL' ),
			},
		} );

		const backupDescription = __( 'Always-on backups ensure you never lose your site.' );
		const backupDescriptionRealtime = __(
			'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
		);
		const planLink = (
			<a
				href={ `https://wordpress.com/plans/my-plan/${ siteRawlUrl }` }
				target="_blank"
				rel="noopener noreferrer"
			/>
		);
		const additionalProps = {
			purchase,
			isCurrent: true,
		};

		switch ( planClass ) {
			case 'is-daily-backup-plan':
				return {
					title: dailyBackupTitle,
					subtitle: purchasedDate,
					description: backupDescription,
					...additionalProps,
				};
			case 'is-realtime-backup-plan':
				return {
					title: realTimeBackupTitle,
					subtitle: purchasedDate,
					description: backupDescriptionRealtime,
					...additionalProps,
				};
			case 'is-personal-plan':
				return {
					title: dailyBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Personal Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescription,
					...additionalProps,
				};
			case 'is-premium-plan':
				return {
					title: dailyBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Premium Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescription,
					...additionalProps,
				};
			case 'is-business-plan':
				return {
					title: realTimeBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Professional Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescriptionRealtime,
					...additionalProps,
				};
		}
	}

	findPrioritizedPurchase() {
		const { activeSitePurchases } = this.props;

		// Note: the order here is important, as it resolves cases where a site
		// has both a plan and a product at the same time.
		const planClasses = [
			'is-business-plan',
			'is-realtime-backup-plan',
			'is-premium-plan',
			'is-personal-plan',
			'is-daily-backup-plan',
		];

		for ( const planClass of planClasses ) {
			const purchase = activeSitePurchases.find(
				item => getPlanClass( item.product_slug ) === planClass
			);
			if ( undefined !== purchase ) {
				return purchase;
			}
		}

		return false;
	}

	renderTitleSection() {
		return (
			<Fragment>
				<h1 className="plans-section__header">{ __( 'Solutions' ) }</h1>
				<h2 className="plans-section__subheader">
					{ __( "Just looking for backups? We've got you covered." ) }
				</h2>
			</Fragment>
		);
	}

	renderSingleProductContent() {
		const {
			dailyBackupUpgradeUrl,
			isFetchingData,
			multisite,
			plans,
			products,
			realtimeBackupUpgradeUrl,
			sitePlan,
		} = this.props;

		// Jetpack Backup does not support Multisite yet.
		if ( multisite ) {
			return null;
		}

		const plan = get( sitePlan, 'product_slug' );
		const upgradeLinks = {
			daily: dailyBackupUpgradeUrl,
			'real-time': realtimeBackupUpgradeUrl,
		};

		const purchase = this.findPrioritizedPurchase();
		if ( purchase ) {
			const productCardProps = this.getProductCardPropsForPurchase( purchase );
			return (
				<div className="plans-section__single-product">
					<ProductCard { ...productCardProps } />
				</div>
			);
		}

		return (
			<SingleProductBackup
				plan={ plan }
				products={ products }
				upgradeLinks={ upgradeLinks }
				isFetchingData={ isFetchingData || ! plans }
			/>
		);
	}

	render() {
		return (
			<Fragment>
				{ this.renderTitleSection() }
				{ this.renderSingleProductContent() }
			</Fragment>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		dailyBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-daily' ),
		multisite: isMultisite( state ),
		plans: getAvailablePlans( state ),
		products: getProducts( state ),
		realtimeBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-realtime' ),
		sitePlan: getSitePlan( state ),
		siteRawlUrl: getSiteRawUrl( state ),
		isFetchingData: isFetchingSiteData( state ) || isFetchingProducts( state ),
	};
} )( ProductSelector );
