/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Card from 'components/card';
import FoldableCard from 'components/foldable-card';
import Button from 'components/button';
import Spinner from 'components/spinner';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

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

const JumpStart = React.createClass( {

	displayName: 'JumpStart',

	render: function() {
		const trackLearnMore = () => analytics.tracks.recordEvent( 'jetpack_jumpstart_learn_more', {} );
		let jumpstartModules = this.props.jumpstartFeatures.map( ( module ) => (
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
			<div className="jp-jumpstart">
				<h1 className="jp-jumpstart__title">
					{ __( 'Jump Start your Site' ) }
				</h1>
				<Card className="jp-jumpstart__cta-container">
					<Card className="jp-jumpstart__cta">
						{ this.props.isJumpstarting ? <Spinner /> : null }
						<p className="jp-jumpstart__description">
							{ __( "Quickly enhance your site by activating Jetpack's recommended features." ) }
						</p>
						<Button primary={ true } onClick={ this.props.jumpStartActivate }>
							{ __( 'Activate Recommended Features' ) }
						</Button>
					</Card>
					<FoldableCard
						className="jp-jumpstart__features"
						clickableHeaderText={ true }
						subheader="Learn more"
						onOpen={ trackLearnMore }
					>
						<p className="jp-jumpstart__description">
							{ __( "Jetpack's recommended features include:" ) }
						</p>

						<div className="jp-jumpstart__feature-list">
							{ jumpstartModules }
						</div>

						<p className="jp-jumpstart__note">
							{ __( 'Features can be activated or deactivated at any time.' ) }
						</p>
					</FoldableCard>
				</Card>
				<a
					className="jp-jumpstart__skip-step"
					role="button"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.props.jumpStartSkip ) }
					onClick={ this.props.jumpStartSkip }
					title={ __( 'Skip the Jetpack Jumpstart process' ) }>
					{ __( 'Skip this step' ) }
				</a>
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
