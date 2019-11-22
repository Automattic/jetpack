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
import { getUpgradeUrl } from 'state/initial-state';
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
		} = this.props;

		const plan = get( this.props.sitePlan, 'product_slug' );
		const upgradeLinks = {
			daily: dailyBackupUpgradeUrl,
			'real-time': realtimeBackupUpgradeUrl,
		};

		const activePurchaseProductSlugs = activeSitePurchases.map( purchase => purchase.product_slug );
		const planClass = getPlanClass( this.props.sitePlan );

		// singleProductContent should maintain this priority order for display:
		// 1. Professional
		// 2. Real-time
		// 3. Premium
		// 4. Personal
		// 5. Daily
		// 6. Free
		let singleProductContent;
		if ( 'is-business-plan' === planClass ) {
			singleProductContent = <ProductCard title="Business Plan" />;
		} else if ( activePurchaseProductSlugs.includes( 'jetpack_backup_realtime' ) ) {
			singleProductContent = <ProductCard title="Jetpack Backup Realtime" />;
		} else if ( 'is-premium-plan' === planClass ) {
			singleProductContent = <ProductCard title="Premium Plan" />;
		} else if ( 'is-personal-plan' === planClass ) {
			singleProductContent = <ProductCard title="Personal Plan" />;
		} else if ( activePurchaseProductSlugs.includes( 'jetpack_backup_daily' ) ) {
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
						purchase: true,
						isCurrent: true,
					} }
				/>
			);
		} else if ( products && 'is-free-plan' === planClass ) {
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
		isFetchingData: isFetchingSiteData( state ) || isFetchingProducts( state ),
	};
} )( Plans );
