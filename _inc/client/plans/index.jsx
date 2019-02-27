/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { getPlanClass, FEATURE_UNLIMITED_PREMIUM_THEMES } from 'lib/plans/constants';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import { getSitePlan, getAvailableFeatures, getActiveFeatures } from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';
import ThemesPromoCard from 'components/themes-promo-card';

import PlanGrid from './plan-grid';

export class Plans extends React.Component {
	themesPromo = () => {
		const sitePlan = this.props.sitePlan.product_slug || '';
		const planClass = 'dev' !== this.props.plan ? getPlanClass( sitePlan ) : 'dev';

		switch ( planClass ) {
			case 'is-personal-plan':
			case 'is-premium-plan':
			case 'is-free-plan':
				return <ThemesPromoCard plan={ planClass } siteRawUrl={ this.props.siteRawUrl } />;
		}

		return null;
	};

	renderContent = () => {
		let themePromo = '';

		const premiumThemesAvailable =
				'undefined' !== typeof this.props.availableFeatures[ FEATURE_UNLIMITED_PREMIUM_THEMES ],
			premiumThemesActive = includes( this.props.activeFeatures, FEATURE_UNLIMITED_PREMIUM_THEMES ),
			showThemesPromo = premiumThemesAvailable && ! premiumThemesActive;

		if ( showThemesPromo ) {
			themePromo = this.themesPromo();
		}

		return (
			<div>
				{ themePromo }
				<PlanGrid />
			</div>
		);
	};

	render() {
		return (
			<div>
				<QuerySite />
				{ this.renderContent() }
			</div>
		);
	}
}

export default connect( state => {
	return {
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
		sitePlan: getSitePlan( state ),
		availableFeatures: getAvailableFeatures( state ),
		activeFeatures: getActiveFeatures( state ),
	};
} )( Plans );
