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
import { getSitePlan, isFetchingSiteData } from 'state/site';
import { getProducts, isFetchingProducts } from 'state/products';

export class Plans extends React.Component {
	render() {
		const {
			dailyBackupUpgradeUrl,
			products,
			realtimeBackupUpgradeUrl,
			isFetchingData,
		} = this.props;

		const plan = get( this.props.sitePlan, 'product_slug' );
		const upgradeLinks = {
			daily: dailyBackupUpgradeUrl,
			'real-time': realtimeBackupUpgradeUrl,
		};

		return (
			<React.Fragment>
				<QueryProducts />
				<QuerySite />
				<SingleProductBackup
					plan={ plan }
					products={ products }
					upgradeLinks={ upgradeLinks }
					isFetchingData={ isFetchingData }
				/>
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
		isFetchingData: isFetchingSiteData( state ) || isFetchingProducts( state ),
	};
} )( Plans );
