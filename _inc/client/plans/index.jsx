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
	render() {
		const {
			activeSitePurchases,
			dailyBackupUpgradeUrl,
			isFetchingData,
			products,
			realtimeBackupUpgradeUrl,
			sitePlan,
			siteRawlUrl,
		} = this.props;

		// const siteSlug = get( this.props.plan );
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

		// singleProductContent should maintain this priority order for display:
		// 1. Professional
		// 2. Real-time
		// 3. Premium
		// 4. Personal
		// 5. Daily
		// 6. Free
		let singleProductContent;
		if ( 'is-business-plan' === planClass ) {
			singleProductContent = (
				<ProductCard
					{ ...{
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
					} }
				/>
			);
		} else if ( undefined !== activeJetpackBackupRealtimePurchase ) {
			singleProductContent = (
				<ProductCard
					{ ...{
						title: __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
							components: {
								em: <em />,
							},
						} ),
						subtitle: __( 'Purchased %(purchaseDate)s', {
							args: {
								purchaseDate: moment(
									activeSitePurchases.find(
										purchase => 'jetpack_backup_realtime' === purchase.product_slug
									).subscribedDate
								).format( 'YYYY-MM-DD' ),
							},
						} ),
						description: __(
							'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
						),
						purchase: activeJetpackBackupRealtimePurchase,
						isCurrent: true,
					} }
				/>
			);
		} else if ( 'is-premium-plan' === planClass ) {
			singleProductContent = (
				<ProductCard
					{ ...{
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
					} }
				/>
			);
		} else if ( 'is-personal-plan' === planClass ) {
			singleProductContent = (
				<ProductCard
					{ ...{
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
					} }
				/>
			);
		} else if ( undefined !== activeJetpackBackupDailyPurchase ) {
			singleProductContent = (
				<ProductCard
					{ ...{
						title: __( 'Jetpack Backup {{em}}Daily{{/em}}', {
							components: {
								em: <em />,
							},
						} ),
						subtitle: __( 'Purchased %(purchaseDate)s', {
							args: {
								purchaseDate: moment(
									activeSitePurchases.find(
										purchase => 'jetpack_backup_daily' === purchase.product_slug
									).subscribedDate
								).format( 'YYYY-MM-DD' ),
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
						purchase: activeJetpackBackupDailyPurchase,
						isCurrent: true,
					} }
				/>
			);
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
