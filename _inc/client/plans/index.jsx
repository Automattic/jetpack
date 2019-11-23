/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { translate as __, moment } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import PlanGrid from './plan-grid';
import { SingleProductBackup } from './single-product-backup';
import QueryProducts from 'components/data/query-products';
import QuerySite from 'components/data/query-site';
import ProductCard from 'components/product-card';
import { getPlanClass } from 'lib/plans/constants';
import { getSiteRawUrl, getUpgradeUrl } from 'state/initial-state';
import { getProducts, isFetchingProducts } from 'state/products';
import { getActiveSitePurchases, getSitePlan, isFetchingSiteData } from 'state/site';

export class Plans extends React.Component {
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
					description: (
						<>
							<p>
								{ __( '{{strong}}Looking for more?{{/strong}}', {
									components: {
										strong: <strong />,
									},
								} ) }
							</p>
							<p>
								{ __(
									'With Real-time backups, we save as you edit and you’ll get unlimited backup archives.'
								) }
							</p>
						</>
					),
					purchase,
					isCurrent: true,
				};
			case 'jetpack_backup_realtime':
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

		let singleProductContent;

		const purchase = this.findPrioritizedPurchase();
		if ( purchase ) {
			const productCardProps = this.getProductCardPropsForPurchase( purchase );
			singleProductContent = (
				<Fragment>
					{ this.getTitleSection() }
					<div className="plans-section__single-product">
						<ProductCard { ...productCardProps } />
					</div>
				</Fragment>
			);
		} else {
			singleProductContent = (
				<Fragment>
					{ this.getTitleSection() }
					<SingleProductBackup
						plan={ plan }
						products={ products }
						upgradeLinks={ upgradeLinks }
						isFetchingData={ isFetchingData }
					/>
				</Fragment>
			);
		}

		return (
			<React.Fragment>
				<QueryProducts />
				<QuerySite />
				{ singleProductContent }
				<PlanGrid />
			</React.Fragment>
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
} )( Plans );
