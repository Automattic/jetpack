/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import {
	getPlanClass,
	FEATURE_UNLIMITED_PREMIUM_THEMES
} from 'lib/plans/constants';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import {
	getSitePlan,
	getAvailableFeatures,
	getActiveFeatures,
} from 'state/site';
import QuerySite from 'components/data/query-site';
import { getSiteConnectionStatus } from 'state/connection';
import ThemesPromoCard from 'components/themes-promo-card';

import PlanHeader from './plan-header';
import PlanBody from './plan-body';

export class Plans extends React.Component {
    themesPromo = () => {
		const sitePlan = this.props.sitePlan.product_slug || '';
		const planClass = 'dev' !== this.props.plan
			? getPlanClass( sitePlan )
			: 'dev';

		switch ( planClass ) {
			case 'is-personal-plan':
			case 'is-premium-plan':
			case 'is-free-plan':
				return <ThemesPromoCard plan={ planClass } siteRawUrl={ this.props.siteRawUrl } />;
		}

		return null;
	};

	renderContent = () => {
		let sitePlan = this.props.sitePlan.product_slug || '',
			availableFeatures = this.props.availableFeatures,
			activeFeatures = this.props.activeFeatures,
			themePromo = '';
		const planClass = 'dev' !== this.props.plan
			? getPlanClass( sitePlan )
			: 'dev';
		if ( 'dev' === this.props.getSiteConnectionStatus( this.props ) ) {
			sitePlan = 'dev';
			availableFeatures = {};
			activeFeatures = {};
		}

		const premiumThemesAvailable = 'undefined' !== typeof this.props.availableFeatures[ FEATURE_UNLIMITED_PREMIUM_THEMES ],
			premiumThemesActive = includes( this.props.activeFeatures, FEATURE_UNLIMITED_PREMIUM_THEMES ),
			showThemesPromo = premiumThemesAvailable && ! premiumThemesActive;

		if ( showThemesPromo ) {
			themePromo = this.themesPromo();

			// Don't show the rest of the promos if theme promo available and on Free plan.
			if ( 'is-free-plan' === planClass ) {
				return themePromo;
			}
		}

		return (
			<div>
				{ themePromo }
				<div className="jp-landing__plans dops-card">
					<PlanHeader plan={ sitePlan } siteRawUrl={ this.props.siteRawUrl } />
					<PlanBody
						plan={ sitePlan }
						availableFeatures={ availableFeatures }
						activeFeatures={ activeFeatures }
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						rewindStatus={ this.props.rewindStatus }
					/>
				</div>
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

export default connect(
	( state ) => {
		return {
			getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
			sitePlan: getSitePlan( state ),
			availableFeatures: getAvailableFeatures( state ),
			activeFeatures: getActiveFeatures( state ),
		};
	}
)( Plans );
