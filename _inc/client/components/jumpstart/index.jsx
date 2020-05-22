/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting
} from 'state/jumpstart';
import { getModulesByFeature as _getModulesByFeature } from 'state/modules';
import { imagePath } from 'constants/urls';
import JetpackDialogue from 'components/jetpack-dialogue';

class JumpStart extends React.Component {
	static displayName = 'JumpStart';

	activateButton = () => {
		return <Button
			primary={ true }
			onClick={ this.props.jumpStartActivate }
			disabled={ this.props.isJumpstarting }
		>
			{ this.props.isJumpstarting ? __( 'Activating recommended features…' ) : __( 'Activate recommended features' ) }
		</Button>;
	};

	renderInnerContent() {
		/* eslint-disable react/no-danger */
		const jumpstartModules = this.props.jumpstartFeatures.map( ( module ) => (
			<div
				className="jp-jumpstart__feature-list-column"
				key={ `module-card_${ module.name }` /* https://fb.me/react-warning-keys */ } >
				<div className="jp-jumpstart__feature-content">
					<h4
						className="jp-jumpstart__feature-content-title"
						title={ module.name }>
						{ module.name }
					</h4>
					<p dangerouslySetInnerHTML={ renderJumpstartDescription( module ) } />
				</div>
			</div>
		) );
		/* eslint-enable react/no-danger */

		return (
			<div className="jp-jumpstart">
				<p>
					{ __( "We're now collecting stats, securing your site, and speeding up your images. Pretty soon you'll be able to see everything going on with your site right through Jetpack! Welcome aboard." ) }
				</p>

				<p>
					{ this.activateButton() }
				</p>

				<div>
					<h2 className="jp-jumpstart__feature-heading">
						{ __( "Jetpack's recommended features include:" ) }
					</h2>

					<div className="jp-jumpstart__feature-list">
						{ jumpstartModules }
					</div>

					{ this.activateButton() }

					<p className="jp-jumpstart__note">
						{ __( 'Features can be activated or deactivated at any time.' ) }
					</p>
				</div>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'man-and-laptop.svg' } width="199" height="153" alt={ __( 'Person with laptop' ) } /> }
				title={ __( 'Your Jetpack site is ready to go!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.jumpStartSkip }
			/>
		);
	}
}

export default connect(
	state => {
		return {
			isJumpstarting: _isJumpstarting( state ),
			jumpstartFeatures: _getModulesByFeature( state, 'Jumpstart' )
		};
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );

function renderJumpstartDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.jumpstart_desc };
}
