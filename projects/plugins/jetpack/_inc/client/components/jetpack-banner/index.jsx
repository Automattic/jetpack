import { Banner, connect as bannerConnect } from 'components/banner';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect as reduxConnect } from 'react-redux';
import { arePromotionsActive, userCanManageModules } from 'state/initial-state';

export class JetpackBanner extends Banner {
	static propTypes = {
		callToAction: PropTypes.string,
		className: PropTypes.string,
		description: PropTypes.node,
		eventFeature: PropTypes.string,
		feature: PropTypes.string,
		href: PropTypes.string,
		icon: PropTypes.string,
		iconAlt: PropTypes.string,
		iconSrc: PropTypes.string,
		list: PropTypes.arrayOf( PropTypes.string ),
		onClick: PropTypes.func,
		trackBannerDisplay: PropTypes.func,
		path: PropTypes.string,
		plan: PropTypes.string,
		siteSlug: PropTypes.string,
		title: PropTypes.node.isRequired,
	};

	static defaultProps = {
		onClick: noop,
		trackBannerDisplay: noop,
		plan: '',
	};

	componentDidMount() {
		if ( ! this.props.hidePromotionBanner && this.props.arePromotionsActive ) {
			this.props.trackBannerDisplay();
		}
	}

	render() {
		// Hide promotion banners from non-admins, since they can't upgrade the site.
		if ( this.props.hidePromotionBanner ) {
			return null;
		}

		return this.props.arePromotionsActive ? <Banner { ...this.props } /> : null;
	}
}

/**
 * Redux-connect a JetpackBanner or subclass.
 *
 * @param {JetpackBanner} Component - Component to connect.
 * @returns {Component} Wrapped component.
 */
export function connect( Component ) {
	return reduxConnect( ( state, ownProps ) => {
		const userCanPurchasePlan = userCanManageModules( state );

		return {
			arePromotionsActive: arePromotionsActive( state ),
			userCanPurchasePlan: userCanPurchasePlan,
			hidePromotionBanner: !! ownProps.plan && ! userCanPurchasePlan,
		};
	} )( bannerConnect( Component ) );
}

export default connect( JetpackBanner );
