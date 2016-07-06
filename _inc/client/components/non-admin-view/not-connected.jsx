/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import { isCurrentUserLinked as _isCurrentUserLinked } from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';
import { imagePath } from 'constants';

const NonAdminViewNotConnected = React.createClass( {

	renderContent() {
		return (
			<div className="jp-jetpack-connect__container">
				<h1 className="jp-jetpack-connect__container-title" title="Please connect Jetpack to WordPress.com">
					{ __( 'Please Connect Jetpack' ) }
				</h1>

				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __( 'Please connect to or create a WordPress.com account to get access to powerful WordPress.com features including the new editor, enhanced stats, and an overall faster WordPress experience.' ) }
					</p>
					<ConnectButton connectUser={ true } />
					<p><a href="https://wordpress.com/start/jetpack/" className="jp-jetpack-connect__link">{ __( 'No WordPress.com account? Create one for free.' ) }</a></p>
				</Card>

				<Card className="jp-jetpack-connect__feature jp-jetpack-connect__traffic">

					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title="Drive more traffic to your site with Jetpack">
							{ __( 'Drive more traffic to your site' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __( 'Jetpack has many traffic and engagement tools to help you get more viewers to your site and keep them there.' ) }
						</p>
						<div className="jp-jetpack-connect__header-img-container">
							<img src={ imagePath + 'long-clouds.svg' } width="1160" height="63" alt="Decoration: Jetpack clouds" className="jp-jetpack-connect__header-img" /> {/* defining width and height for IE here */}
							<img src={ imagePath + 'stat-bars.svg' } width="400" alt="Decoration: Jetpack bar graph" className="jp-jetpack-connect__header-img" />
						</div>
					</header>

					<div className="jp-jetpack-connect__interior-container">

						<h2 className="jp-jetpack-connect__container-subtitle" title="Track your growth">
							{ __( 'Track your growth' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Jetpack harnesses the power of WordPress.com to show you detailed insights about your visitors, what they’re reading, and where they’re coming from.'
							) }
						</p>

						<img src={ imagePath + 'stats-example-med.png' }
							 srcSet={ `${imagePath}stats-example-sm.png 445w, ${imagePath}stats-example-med.png 770w, ${imagePath}stats-example-lrg.png 1200w` }
							 className="jp-jetpack-connect__feature-image" alt="Jetpack statistics and traffic insights graph" />
					</div>
				</Card>
				<Card className="jp-jetpack-connect__feature">

					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title="Site security and peace of mind with Jetpack">
							{ __( 'Site security and peace of mind' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Jetpack blocks malicious log in attempts, lets you know if your site goes down, and can automatically update your plugins, so you don’t have to worry.'
							) }
						</p>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<div className="jp-jetpack-connect__feature-list">
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Protect feature" className="dops-section-header__label">
									{ __( 'Protect', { context: 'Header. Noun: Protect is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Block site attacks">
										{ __( 'Block site attacks.' ) }
									</h4>
									<p>
										{ __(
											'Gain peace of mind with Protect, the tool that has blocked billions of login attacks across millions of sites.'
										) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Single Sign On feature" className="dops-section-header__label">
									{ __( 'Single Sign On', { context: 'Header. Noun: Single Sign On is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Live site monitoring">
										{ __( 'Sign in once, everywhere.' ) }
									</h4>
									<p>
										{ __( 'Once you connect, you can use your WordPress.com log in to sign into any of your Jetpack sites with ease.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Two Factor Auth feature" className="dops-section-header__label">
									{ __( 'Manage', { context: 'Header. Noun: Two Factor Auth is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Automatic site updates">
										{ __( 'An extra layer of security.' ) }
									</h4>
									<p>
										{ __( 'Two factor authentication enables you to use your phone or an app as an extra layer of login security.' ) }
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<Card className="jp-jetpack-connect__feature">
					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title="Jetpack offers free, professional support">
							{ __( 'Did we mention free, professional support?' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								"Jetpack is supported by some of the most technical and passionate people in the community. They're located around the globe and ready to help you."
							) }
						</p>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<img src={ imagePath + 'aurora-med.jpg' }
							 srcSet={ `${imagePath}aurora-sm.jpg 600w, ${imagePath}aurora-med.jpg 770w, ${imagePath}aurora-lrg.jpg 1200w` }
							 className="jp-jetpack-connect__feature-image" alt="Jetpack's free support team" />
					</div>
				</Card>
				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __(
							"Join the millions of users who rely on Jetpack to enhance and secure their sites. We’re passionate about WordPress and here to make your life easier."
						) }
					</p>
					<ConnectButton />
				</Card>
			</div>
		);
	},

	render() {
		return (
			<div>
				<QueryUserConnectionData />
				{ this.renderContent() }
			</div>
		);
	}
} );

export default NonAdminViewNotConnected;