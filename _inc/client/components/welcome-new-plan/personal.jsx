/**
 * External dependencies
 */
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import Button from 'components/button';
import { imagePath } from 'constants';

class WelcomePersonal extends Component {
	componentDidMount() {
		analytics.tracks.recordEvent( 'jetpack_warm_welcome_plan_view', {
			planClass: this.props.planClass,
		} );
	}

	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Thanks for choosing a Jetpack Personal plan. Jetpack is now backing up your site and ' +
						'scanning for security threats.'
					) }
				</p>
				<img src={ imagePath + 'customize-theme.svg' } className="jp-welcome__svg" alt={ __( 'Themes' ) } />
				<p>
					{ __( 'With Jetpack Personal, you have access to more than 100 free, professionally-designed WordPress ' +
						'themes. Choose the theme that best fits your site and customize colors, images, or add a variety of ' +
						'new widgets.'
					) }
				</p>
				<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'Sharing' ) } />
				<p>
					{ __( 'Using Jetpack’s powerful Publicize feature and built-in sharing tools, you’ll find new ways ' +
						'to grow your following and increase traffic. Automatically share your newest posts on social media, ' +
						'or allow followers to subscribe via email for your latest content right in their inbox.'
					) }
				</p>
				<img src={ imagePath + 'security.svg' } className="jp-welcome__svg" alt={ __( 'Security' ) } />
				<p>
					{ __( 'Jetpack keeps you safe, too: you’re protected from spam in comments and contact forms, and our' +
						' brute force login protection prevents hackers from accessing your data. And if something does go ' +
						'wrong, you can restore a backup of your site in a single click.'
					) }
				</p>
				<Button
					className="jp-welcome-new-plan__button"
					href={ '#/traffic' }
					onClick={ this.props.dismiss }
					primary
				>
					{ __( 'Got it!' ) }
				</Button>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'connect-jetpack.svg' } width="160" alt={ __( 'Welcome personal' ) } style={ { paddingLeft: '60px' } } /> }
				title={ __( 'Your Personal Jetpack plan is powering up!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-personal"
			/>
		);
	}
}

WelcomePersonal.propTypes = {
	dismiss: React.PropTypes.func
};

export default WelcomePersonal;
