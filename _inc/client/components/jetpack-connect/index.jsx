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
import { getConnectUrl as _getConnectUrl } from 'state/connection';
import { imagePath } from 'constants';

const JetpackConnect = React.createClass( {
	displayName: 'JetpackConnect',

	render: function() {
		const newAccountUrl = this.props.connectUrl + '&from=new-account-button';

		return (
			<div className="jp-jetpack-connect__container">
				<h1 className="jp-jetpack-connect__container-title" title="Welcome to Jetpack">
					{ __( 'Welcome to Jetpack' ) }
				</h1>

				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __( 'Please connect to or create a WordPress.com account to start using Jetpack. This will enable powerful security, traffic, and customization services.' ) }
					</p>
					<ConnectButton from="landing-page-top" />
					<p>
						<a href={ newAccountUrl } className="jp-jetpack-connect__link">
							{ __( 'No account? Create one for free' ) }
						</a>
					</p>
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
						<div className="jp-jetpack-connect__feature-list">
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Publicize feature" className="dops-section-header__label">
									{ __( 'Publicize', { context: 'Header. Noun: Publicize is a module of Jetpack' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Automated social marketing">
										{ __( 'Automated social marketing.' ) }
									</h4>
									<p>
										{ __( 'Use Publicize to automatically share your posts with friends, followers, and the world.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Sharing and Like features" className="dops-section-header__label">
									{ __( 'Sharing & Like Buttons' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Build a community">
										{ __( 'Build a community.' ) }
									</h4>
									<p>
										{ __( 'Give visitors the tools to share and subscribe to your content.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Related Posts feature" className="dops-section-header__label">
									{ __( 'Related Posts', { context: 'Header. Noun: Related posts is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Increase page views">
									{ __( 'Increase page views.' ) }
									</h4>
									<p>
										{ __( 'Keep visitors engaged by giving them more to share and read with Related Posts.' ) }
									</p>
								</div>
							</div>
						</div>

						<h2 className="jp-jetpack-connect__container-subtitle" title="Track your growth">
							{ __( 'Track your growth' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Jetpack harnesses the power of WordPress.com to show you detailed insights about your visitors, ' +
								'what they’re reading, and where they’re coming from.'
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
								'Jetpack blocks malicious log in attempts, lets you know if your site goes down, ' +
								'and can automatically update your plugins, so you don’t have to worry.'
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
											'Gain peace of mind with Protect, the tool that has blocked billions of ' +
											'login attacks across millions of sites.'
										) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Monitor features" className="dops-section-header__label">
									{ __( 'Monitor', { context: 'Header. Noun: Monitor is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Live site monitoring">
										{ __( 'Live site monitoring.' ) }
									</h4>
									<p>
										{ __( 'Stress less. Monitor will send you real-time alerts if your site ever goes down.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's Manage feature" className="dops-section-header__label">
									{ __( 'Manage', { context: 'Header. Noun: Manage is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<h4 className="jp-jetpack-connect__feature-content-title" title="Automatic site updates">
										{ __( 'Automatic site updates.' ) }
									</h4>
									<p>
										{ __( 'Never fall behind on a security release or waste time updating multiple sites.' ) }
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>
				<Card className="jp-jetpack-connect__feature">
					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title="lightning fast optimized images with Jetpack Photon">
							{ __( 'Lightning fast, optimized images' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Jetpack utilizes the state-of-the-art WordPress.com content delivery network to load your ' +
								'gorgeous imagery super fast. Optimized for any device, and its completely free.'
							) }
						</p>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<img src={ imagePath + 'feature-photon-med.jpg' }
							srcSet={ `${imagePath}feature-photon-sm.jpg 600w, ${imagePath}feature-photon-med.jpg 770w, ${imagePath}feature-photon-lrg.jpg 1200w` }
							className="jp-jetpack-connect__feature-image" alt="Jetpacks photon serves up lightning fast, optimized images" />
					</div>
				</Card>
				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __(
							'Join the millions of users who rely on Jetpack to enhance and secure their sites. ' +
							'We\'re passionate about WordPress and here to make your life easier.'
						) }
					</p>
					<ConnectButton from="landing-page-bottom" />
					<p>
						<a href={ newAccountUrl } className="jp-jetpack-connect__link">
							{ __( 'No account? Create one for free' ) }
						</a>
					</p>
				</Card>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			connectUrl: _getConnectUrl( state )
		}
	}
)( JetpackConnect );
