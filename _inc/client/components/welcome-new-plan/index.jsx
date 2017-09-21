/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants';
import { getSitePlan } from 'state/site';
import { updateSettings } from 'state/settings';

class WelcomeNewPlan extends Component {
	renderInnerContent() {
		const sitePlan = this.props.sitePlan.product_slug || '';
		return (
			<div>
				{ sitePlan }
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'people-around-page.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ this.props.sitePlan.product_slug || '' }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
			/>
		);
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
