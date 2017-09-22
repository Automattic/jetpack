/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import { getPlanClass } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants';
import { getSitePlan } from 'state/site';
import { updateSettings } from 'state/settings';
import WelcomePersonal from './personal';
import WelcomePremium from './premium';
import WelcomeProfessional from './professional';

class WelcomeNewPlan extends Component {
	render() {
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		const defaultProps = {
			dismiss: this.props.dismiss,
			siteRawUrl: this.props.siteRawUrl,
		};

		switch ( planClass ) {
			case 'is-personal-plan' :
				return <WelcomePersonal { ...defaultProps } />;
			case 'is-premium-plan' :
				return <WelcomePremium { ...defaultProps } />;
			case 'is-business-plan' :
				return <WelcomeProfessional { ...defaultProps } />;
			default :
				return (
					<JetpackDialogue
						svg={ <img src={ imagePath + 'people-around-page.svg' } width="250" alt={ __( 'People around page' ) } /> }
						title={ '' }
						content={ '' }
						dismiss={ this.props.dismiss }
					/>
				);
		}
	}
}

WelcomeNewPlan.propTypes = {
	dismiss: React.PropTypes.func
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
