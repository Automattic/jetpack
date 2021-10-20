/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { noop } from 'lodash';
import Banner from 'components/banner';

/**
 * Internal dependencies
 */
import { arePromotionsActive, userCanManageModules } from 'state/initial-state';

class JetpackBanner extends Banner {
	static propTypes = {
		callToAction: PropTypes.string,
		className: PropTypes.string,
		description: PropTypes.node,
		eventFeature: PropTypes.string,
		feature: PropTypes.string,
		href: PropTypes.string,
		icon: PropTypes.string,
		list: PropTypes.arrayOf( PropTypes.string ),
		onClick: PropTypes.func,
		trackBannerDisplay: PropTypes.func,
		path: PropTypes.string,
		plan: PropTypes.string,
		siteSlug: PropTypes.string,
		title: PropTypes.string.isRequired,
	};

	static defaultProps = {
		onClick: noop,
		trackBannerDisplay: noop,
		plan: '',
	};

	componentDidMount() {
		if ( ! this.props.hidePromotionBanner ) {
			this.props.trackBannerDisplay();
		}
	}

	render() {
		// Hide promotion banners from non-admins, since they can't upgrade the site.
		if ( this.props.hidePromotionBanner ) {
			return false;
		}

		return this.props.arePromotionsActive ? <Banner { ...this.props } /> : null;
	}
}

export default connect( ( state, ownProps ) => {
	const userCanPurchasePlan = userCanManageModules( state );

	return {
		arePromotionsActive: arePromotionsActive( state ),
		userCanPurchasePlan: userCanPurchasePlan,
		hidePromotionBanner: !! ownProps.plan && ! userCanPurchasePlan,
	};
} )( JetpackBanner );
