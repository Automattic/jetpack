/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { Component } from 'react';
import { getPlanClass } from 'lib/plans/constants';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { getSitePlan } from 'state/site';
import { updateSettings } from 'state/settings';
import WelcomePersonal from './personal';
import WelcomePremium from './premium';
import WelcomeProfessional from './professional';

class WelcomeNewPlan extends Component {
	constructor() {
		super();
		this.state = {
			planWelcomeDismissed: false,
		};

		this.boundDismiss = this.dismissWelcome.bind( this );
	}

	dismissWelcome() {
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_dismiss', {
			planClass: planClass,
		} );

		this.setState( { planWelcomeDismissed: true } );
		this.props.dismiss();
	}

	render() {
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		const defaultProps = {
			dismiss: this.boundDismiss,
			siteRawUrl: this.props.siteRawUrl,
			planClass: planClass,
		};

		// Hide from non-admins
		if ( ! this.props.newPlanActivated || ! this.props.userCanManageModules || this.state.planWelcomeDismissed ) {
			return false;
		}

		switch ( planClass ) {
			case 'is-personal-plan' :
				return <WelcomePersonal { ...defaultProps } />;
			case 'is-premium-plan' :
				return <WelcomePremium { ...defaultProps } />;
			case 'is-business-plan' :
				return <WelcomeProfessional { ...defaultProps } />;
			default :
				return false;
		}
	}
}

WelcomeNewPlan.propTypes = {
	dismiss: React.PropTypes.func,
	newPlanActivated: React.PropTypes.bool,
	userCanManageModules: React.PropTypes.bool,
};

WelcomeNewPlan.defaultProps = {
	newPlanActivated: false,
	userCanManageModules: false,
};

export default connect(
	( state ) => {
		return {
			sitePlan: getSitePlan( state ),
		};
	},
	( dispatch ) => ( {
		dismiss: () => {
			return dispatch( updateSettings( { show_welcome_for_new_plan: false } ) );
		}
	} )
)( WelcomeNewPlan );
