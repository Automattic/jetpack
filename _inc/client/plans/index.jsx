/**
 * External dependencies
 */
import React from 'react';
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
	getProductCardPropsForPlanClass( planClass ) {
		const { siteRawlUrl } = this.props;

		switch ( planClass ) {
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
				};
		}
	}

	getProductCardPropsForPurchase( purchase ) {
		switch ( purchase.product_slug ) {
			case 'jetpack_backup_daily':
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
		}
	}

	render() {
		const {
			activeSitePurchases,
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

		const activeJetpackBackupDailyPurchase = activeSitePurchases.find(
			purchase => 'jetpack_backup_daily' === purchase.product_slug
		);
		const activeJetpackBackupRealtimePurchase = activeSitePurchases.find(
			purchase => 'jetpack_backup_realtime' === purchase.product_slug
		);
		const planClass = getPlanClass( plan );

		// The order here needs to be maintained so that cases with both a plan and a product
		// display correctly.
		let productCardProps = null;
		if ( 'is-business-plan' === planClass ) {
			productCardProps = this.getProductCardPropsForPlanClass( planClass );
		} else if ( undefined !== activeJetpackBackupRealtimePurchase ) {
			productCardProps = this.getProductCardPropsForPurchase( activeJetpackBackupRealtimePurchase );
		} else if ( 'is-premium-plan' === planClass ) {
			productCardProps = this.getProductCardPropsForPlanClass( 'is-premium-plan' );
		} else if ( 'is-personal-plan' === planClass ) {
			productCardProps = this.getProductCardPropsForPlanClass( 'is-personal-plan' );
		} else if ( undefined !== activeJetpackBackupDailyPurchase ) {
			productCardProps = this.getProductCardPropsForPurchase( activeJetpackBackupDailyPurchase );
		}

		let singleProductContent;
		if ( null !== productCardProps ) {
			singleProductContent = <ProductCard { ...productCardProps } />;
		} else if ( products && [ '', 'is-free-plan' ].includes( planClass ) ) {
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
