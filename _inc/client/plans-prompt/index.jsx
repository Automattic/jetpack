/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Plans from '../plans';
import { translate as __ } from 'i18n-calypso';
import Gridicon from '../components/gridicon';

export class PlansPrompt extends React.Component {
	renderBanner() {
		return (
			<div className="plans-prompt__banner">
				<h2 className="plans-prompt__heading">{ __( 'Explore our Jetpack plans' ) }</h2>
				<p className="plans-prompt__intro">
					{ __( "Now that you're set up, pick a plan that fits your needs." ) }
				</p>
			</div>
		);
	}

	renderFooter() {
		return (
			<div className="plans-prompt__footer">
				<Button href="#/dashboard">
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

export default PlansPrompt;
