/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import PlanGrid from './plan-grid';
import { SingleProductBackup } from './single-product-backup';
import QueryProducts from 'components/data/query-products';
import QuerySite from 'components/data/query-site';
import { getUpgradeUrl } from 'state/initial-state';
import { getProducts, getSitePlan } from 'state/site';

export class Plans extends React.Component {
	render() {
		const { dailyBackupUpgradeUrl, products, realtimeBackupUpgradeUrl } = this.props;

		const upgradeLinks = {
			daily: dailyBackupUpgradeUrl,
			'real-time': realtimeBackupUpgradeUrl,
		};

		return (
			<React.Fragment>
				<QueryProducts />
				<QuerySite />
				{ products && 'jetpack_free' === get( this.props.sitePlan, 'product_slug' ) && (
					<SingleProductBackup products={ products } upgradeLinks={ upgradeLinks } />
				) }
				<PlanGrid />
			</React.Fragment>
		);
	}
}

export default connect( state => {
	return {
		dailyBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-daily' ),
		products: getProducts( state ),
		realtimeBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-realtime' ),
		sitePlan: getSitePlan( state ),
	};
} )( Plans );
