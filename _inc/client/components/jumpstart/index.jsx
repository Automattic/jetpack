/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Card from 'components/card';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import Gridicon from 'components/gridicon';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting
} from 'state/jumpstart';
import { getModulesByFeature as _getModulesByFeature } from 'state/modules';
import onKeyDownCallback from 'utils/onkeydown-callback';
import { imagePath } from 'constants/urls';

const JumpStart = React.createClass( {

	displayName: 'JumpStart',

	activateButton: function() {
		return <Button
			primary={ true }
			onClick={ this.props.jumpStartActivate }
			disabled={ this.props.isJumpstarting }
		>
			{ this.props.isJumpstarting ? __( 'Activating recommended features…' ) : __( 'Activate recommended features' ) }
		</Button>;
	},

	render: function() {
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

		return (
			<div className="jp-jumpstart-full__container">
				<img src={ imagePath + 'stars-full.svg' } width="60" height="60" alt={ __( 'Stars' ) } className="jp-jumpstart-full__svg-stars" />
				<img src={ imagePath + 'jupiter.svg' } width="50" height="100" alt={ __( 'Jupiter' ) } className="jp-jumpstart-full__svg-jupiter" />
				<Gridicon
					icon="cross-small"
					className="jp-jumpstart-full__dismiss"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.props.jumpStartSkip ) }
					onClick={ this.props.jumpStartSkip }
				/>

				<div className="jp-jumpstart">
					<img src={ imagePath + 'man-and-laptop.svg' } width="199" height="153" alt={ __( 'Person with laptop' ) } />

					<h1 className="jp-jumpstart__title">
						{ __( 'Your Jetpack site is ready to go!' ) }
					</h1>

					<Card className="jp-jumpstart__description">
						<p>
							{ __( "We're now collecting stats, securing your site, and speeding up your images. Pretty soon you'll be able to see everything going on with your site right through Jetpack! Welcome aboard." ) }
						</p>
					</Card>

					<Card>
						{ this.activateButton() }
					</Card>

					<Card>
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
					</Card>
				</div>
			</div>
		);
	}
} );

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
