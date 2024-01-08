import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { getSiteAdminUrl, getSiteRawUrl, getSiteId } from 'state/initial-state';
import { getSiteDiscount } from 'state/site/reducer';
import { generateCheckoutLink } from '../utils';

export default WrappedComponent => {
	const Component = props => {
		const { slug, discountData, siteAdminUrl, siteRawUrl, blogID } = props;
		const { code } = discountData;
		const upgradeUrl = useMemo(
			() => generateCheckoutLink( slug, siteAdminUrl, siteRawUrl, code, blogID ),
			[ slug, siteAdminUrl, siteRawUrl, code, blogID ]
		);

		return <WrappedComponent upgradeUrl={ upgradeUrl } { ...props } />;
	};

	return connect( state => ( {
		discountData: getSiteDiscount( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		siteRawUrl: getSiteRawUrl( state ),
		blogID: getSiteId( state ),
	} ) )( Component );
};
