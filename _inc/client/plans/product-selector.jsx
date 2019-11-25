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
import { getActiveSitePurchases, getSitePlan, isFetchingSiteData } from '../state/site';
import { getSiteRawUrl, getUpgradeUrl } from '../state/initial-state';
import { getProducts, isFetchingProducts } from '../state/products';
// import { JETPACK_PRODUCTS } from '../lib/products/constants';

class ProductSelector extends Component {
	getTitleSection() {
		return (
			<Fragment>
				<h1 className="plans-section__header">{ __( 'Solutions' ) }</h1>
				<h2 className="plans-section__subheader">
					{ __( "Just looking for backups? We've got you covered." ) }
				</h2>
			</Fragment>
		);
	}

	getProductCardPropsForPurchase( purchase ) {
		const { siteRawlUrl } = this.props;

		const planClass = getPlanClass( purchase.product_slug );

		switch ( planClass ) {
			case 'is-daily-backup-plan':
				return {
					title: __( 'Jetpack Backup {{em}}Daily{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
					subtitle: __( 'Purchased %(purchaseDate)s', {
						args: {
							purchaseDate: moment( purchase.subscribedDate ).format( 'YYYY-MM-DD' ),
						},
					} ),
					description: __(
						'{{strong}}Looking for more?{{/strong}} With Real-time backups, we save as you edit and you’ll get unlimited backup archives.',
						{
							components: {
								strong: <strong />,
							},
						}
					),
					purchase,
					isCurrent: true,
				};
			case 'is-jetpack-backup-realtime':
				return {
					title: __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
					subtitle: __( 'Purchased %(purchaseDate)s', {
						args: {
							purchaseDate: moment( purchase.subscribedDate ).format( 'YYYY-MM-DD' ),
						},
					} ),
					description: __(
						'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
					),
					purchase,
					isCurrent: true,
				};
			case 'is-personal-plan':
				return {
					title: __( 'Jetpack Backup {{em}}Daily{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
					subtitle: __( 'Included in your {{planLink}}Personal Plan{{/planLink}}', {
						components: {
							planLink: <a href={ `/plans/my-plan/${ siteRawlUrl }` } />,
						},
					} ),
					description: __( 'Always-on backups ensure you never lose your site.' ),
					purchase,
					isCurrent: true,
				};
			case 'is-premium-plan':
				return {
					title: __( 'Jetpack Backup {{em}}Daily{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
					subtitle: __( 'Included in your {{planLink}}Premium Plan{{/planLink}}', {
						components: {
							planLink: <a href={ `/plans/my-plan/${ siteRawlUrl }` } />,
						},
					} ),
					description: __( 'Always-on backups ensure you never lose your site.' ),
					purchase,
					isCurrent: true,
				};
			case 'is-business-plan':
				return {
					title: __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
					subtitle: __( 'Included in your {{planLink}}Professional Plan{{/planLink}}', {
						components: {
							planLink: <a href={ `/plans/my-plan/${ siteRawlUrl }` } />,
						},
					} ),
					description: __(
						'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
					),
					purchase,
					isCurrent: true,
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

	render() {
		let singleProductContent;
		const {
			dailyBackupUpgradeUrl,
			isFetchingData,
			products,
			realtimeBackupUpgradeUrl,
			sitePlan,
		} = this.props;

		const plan = get( sitePlan, 'product_slug' );
		const upgradeLinks = {
			daily: dailyBackupUpgradeUrl,
			'real-time': realtimeBackupUpgradeUrl,
		};

		const purchase = this.findPrioritizedPurchase();
		if ( purchase ) {
			const productCardProps = this.getProductCardPropsForPurchase( purchase );
			singleProductContent = (
				<div className="plans-section__single-product">
					<ProductCard { ...productCardProps } />
				</div>
			);
		} else {
			singleProductContent = (
				<SingleProductBackup
					plan={ plan }
					products={ products }
					upgradeLinks={ upgradeLinks }
					isFetchingData={ isFetchingData }
				/>
			);
		}

		return (
			<Fragment>
				{ this.getTitleSection() }
				{ singleProductContent }
			</Fragment>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		dailyBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-daily' ),
		products: getProducts( state ),
		realtimeBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-realtime' ),
		sitePlan: getSitePlan( state ),
		siteRawlUrl: getSiteRawUrl( state ),
		isFetchingData: isFetchingSiteData( state ) || isFetchingProducts( state ),
	};
} )( ProductSelector );
