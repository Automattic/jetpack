/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';

// for inline settings
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { getModule } from 'state/modules';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import decodeEntities from 'lib/decode-entities';

const ModuleSettingsComponent = connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
		};
	}
)( moduleSettingsForm(
	class extends Component {
		render() {
			// TODO: better class name
			const module = this.props.module( this.props.module_slug );
			return (
				<div className="jp-upgrade-notice__enable-module">
					<SettingsGroup
						hasChild
						disableInDevMode
						module={ module }>

						<ModuleToggle
							slug={ this.props.module_slug }
							disabled={ false }
							activated={ this.props.getOptionValue( this.props.module_slug ) }
							toggling={ this.props.isSavingAnyOption( this.props.module_slug ) }
							toggleModule={ this.toggleModule }
						>
							<span className="jp-form-toggle-explanation">
								{ decodeEntities( module.description ) }
							</span>
						</ModuleToggle>
					</SettingsGroup>
				</div>
			);
		}
	}
) );

class WelcomePremium extends Component {
	constructor( props ) {
		super( props );

		// Preparing event handlers once to avoid calling bind on every render
		this.clickCtaDismissVideo = this.clickCtaDismiss.bind( this, 'video' );
		this.clickCtaDismissAds = this.clickCtaDismiss.bind( this, 'ads' );
	}
	componentDidMount() {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_view', {
			planClass: this.props.planClass,
		} );
	}

	clickCtaDismiss( cta ) {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_click', {
			planClass: this.props.planClass,
			cta: cta,
		} );

		this.props.dismiss();
	}

	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Thanks for choosing Jetpack Premium. Jetpack is now backing up your site, scanning for ' +
						' security threats, and enabling monetization features.'
					) }
				</p>
				<img src={ imagePath + 'customize-theme.svg' } className="jp-welcome__svg" alt={ __( 'Themes' ) } />
				<p>
					{ __( 'With Jetpack Premium, you can create the perfect site, no matter its purpose. Customize your site’s' +
						' appearance with one of more than 100 free themes, or enhance your content with unlimited HD video ' +
						'-- all hosted free of ads or watermarks.'
					) }
				</p>
				<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'Sharing' ) } />
				<p>
					{ __( 'Using Jetpack’s powerful sharing tools, you can automatically share your newest posts on social media,' +
						' or schedule your content to be re-shared at any date or time you choose. And along with growing your ' +
						'following, you can grow your business with tools like payment buttons and ads.'
					) }
				</p>
				<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'WordAds' ) } />
				<ModuleSettingsComponent module_slug="wordads" />
				<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'VideoPress' ) } />
				<ModuleSettingsComponent module_slug="videopress" />
				<img src={ imagePath + 'security.svg' } className="jp-welcome__svg" alt={ __( 'Security' ) } />
				<p>
					{ __( 'Keeping your hard work safe is important, too. Jetpack Premium gives you brute force' +
						' login protection, automated spam filtering, and malware scanning. You also get daily backups ' +
						' with hassle-free restores, just in case you need them.'
					) }
				</p>
				<p>
					{ __( 'Start exploring Jetpack Premium now to see all the benefits of your new plan.' ) }
				</p>
			</div>
		);
	}

	renderBelowContent() {
		return (
			<div>
				<Card
					href={ '#/writing' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissVideo }
				>
					{ __( 'Enable premium video player' ) }
				</Card>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.clickCtaDismissAds }
				>
					{ __( 'Monetize your site with ads' ) }
				</Card>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'generating-cash-2.svg' } width="250" alt={ __( 'Welcome Premium' ) } /> }
				title={ __( 'Your Jetpack Premium plan is powering up!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-premium"
			/>
		);
	}
}

WelcomePremium.propTypes = {
	dismiss: PropTypes.func
};

export default WelcomePremium;
