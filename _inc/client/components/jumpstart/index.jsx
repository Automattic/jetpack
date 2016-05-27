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

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting
} from 'state/jumpstart';

const JumpStart = React.createClass( {

	displayName: 'JumpStart',

	render: function() {
		return (
			<div className="jp-jumpstart">
				<h2 className="jp-jumpstart__title">
					{ __( 'Jump Start your Website' ) }
				</h2>
				<Card className="jp-jumpstart__cta-container">
					<Card className="jp-jumpstart__cta">
						{ this.props.jumpstarting( this.props ) ? <Spinner /> : null }
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
					>
						<p className="jp-jumpstart__description">
							{ __( "Jetpack's recommended features include:" ) }
						</p>

					<div className="jp-jumpstart__feature-list">
							<div className="jp-jumpstart__feature-list-column">
								<div className="jp-jumpstart__feature-content">
									<h4 className="jp-jumpstart__feature-content-title" title="Automated social marketing">
										{ __( 'Photon' ) }
									</h4>
									<p>
										{
											__( 'Mirrors and serves your images from our free and fast image Content Delivery Network (CDN), improving your site’s performance with no additional load on your servers. {{a}}Learn more.{{/a}}', {
												components: {
													a: <a href={ 'https://jetpack.com/support/photon/' } target="_blank" />
												}
											} )
										}
									</p>
								</div>
							</div>
							<div className="jp-jumpstart__feature-list-column">
								<div className="jp-jumpstart__feature-content">
									<h4 className="jp-jumpstart__feature-content-title" title="Build a community">
										{ __( 'Manage' ) }
									</h4>
									<p>
										{
											__( 'Helps you remotely manage plugins, turn on automated updates, and more from WordPress.com. {{a}}Learn more.{{/a}}', {
												components: {
													a: <a href={ 'https://jetpack.com/support/site-management/' } target="_blank" />
												}
											} )
										}
									</p>
								</div>
							</div>
					</div>
					<div className="jp-jumpstart__feature-list">
							<div className="jp-jumpstart__feature-list-column">
								<div className="jp-jumpstart__feature-content">
									<h4 className="jp-jumpstart__feature-content-title" title="Increase page views">
									{ __( 'Single Sign On' ) }
									</h4>
									<p>
										{
											__( 'Lets you log in to all your Jetpack-enabled sites with one click using your WordPress.com account. {{a}}Learn more.{{/a}}', {
												components: {
													a: <a href={ 'https://jetpack.com/support/sso/' } target="_blank" />
												}
											} )
										}
									</p>
								</div>
							</div>
							<div className="jp-jumpstart__feature-list-column">
								<div className="jp-jumpstart__feature-content">
									<h4 className="jp-jumpstart__feature-content-title" title="Increase page views">
									{ __( 'Image Carousel' ) }
									</h4>
									<p>
										{
											__( 'Brings your photos and images to life as full-size, easily navigable galleries. {{a}}Learn more.{{/a}}', {
												components: {
													a: <a href={ 'https://jetpack.com/support/carousel/' } target="_blank" />
												}
											} )
										}
									</p>
								</div>
							</div>
					</div>
					<div className="jp-jumpstart__feature-list">
							<div className="jp-jumpstart__feature-list-column">
								<div className="jp-jumpstart__feature-content">
									<h4 className="jp-jumpstart__feature-content-title" title="Increase page views">
									{ __( 'Related Posts' ) }
									</h4>
									<p>
										{
											__( 'Keep visitors engaged on your blog by highlighting relevant and new content at the bottom of each published post. {{a}}Learn more.{{/a}}', {
												components: {
													a: <a href={ 'https://jetpack.com/support/related-posts/' } target="_blank" />
												}
											} )
										}
									</p>
								</div>
							</div>
						</div>

						<p className="jp-jumpstart__note">
							{ __( 'Features can be activated or deactivated at any time.' ) }
						</p>
					</FoldableCard>
				</Card>
				<a
					onClick={ this.props.jumpStartSkip }
					className="jp-jumpstart__skip-step"
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
			jumpstarting: () => _isJumpstarting( state )
		};
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );
