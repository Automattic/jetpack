/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Plans from '../plans';
import { translate as __ } from 'i18n-calypso';
import Gridicon from '../components/gridicon';
import JetpackLogo from '../components/jetpack-logo';
import { getAvailablePlans } from 'state/site/reducer';

export class PlansPrompt extends React.Component {
	trackStartWithFreeClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'free-plan',
			feature: 'plans-prompt',
		} );
	}

	renderBanner() {
		return (
			<div className="plans-prompt__banner">
				<JetpackLogo className="plans-prompt__logo" />
				<h2 className="plans-prompt__heading">{ __( 'Explore our Jetpack plans' ) }</h2>
				<p className="plans-prompt__intro">
					{ __( "Now that you're set up, pick a plan that fits your needs." ) }
				</p>
			</div>
		);
	}

	renderFooter() {
		if ( ! this.props.plans ) {
			return null;
		}
		return (
			<div className="plans-prompt__footer">
				<Button
					href={ this.props.siteAdminUrl + 'admin.php?page=jetpack' }
					onClick={ this.trackStartWithFreeClick }
				>
					{ __( 'Start with free' ) }
					<Gridicon icon={ 'arrow-right' } size={ 18 } />
				</Button>
			</div>
		);
	}

	render() {
		return (
			<div className="plans-prompt">
				{ this.renderBanner() }
				<Plans />
				{ this.renderFooter() }
			</div>
		);
	}
}

export default connect(
	state => ( {
		plans: getAvailablePlans( state ),
	} )
)( PlansPrompt );
