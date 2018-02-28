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
import { getConnectUrl as getConnectUrl } from 'state/connection';
import { imagePath } from 'constants/urls';

class JetpackConnect extends React.Component {
	static displayName = 'JetpackConnect';

	render() {
		const newAccountUrl = this.props.connectUrl + '&from=new-account-button';

		return (
			<div className="jp-jetpack-connect__container">
				<h1 className="jp-jetpack-connect__container-title" title="Welcome to Jetpack">
					{ __( 'Welcome to Jetpack' ) }
				</h1>

				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __( 'Hassle-free design, marketing, and security for your WordPress site. Connect Jetpack to a WordPress.com account to start building your own success story.' ) }
					</p>
					<ConnectButton from="landing-page-top">
						<p>
							<a href={ newAccountUrl } className="jp-jetpack-connect__link">
								{ __( 'No account? Create one for free.' ) }
							</a>
						</p>
					</ConnectButton>
				</Card>

				<Card className="jp-jetpack-connect__feature jp-jetpack-connect__design">
					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title={ __( 'WordPress themes and customization tools for designing your site.' ) }>
							{ __( 'Design the perfect website' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Bring your ideas to life with elegant and professional designs and code-free ' +
								'customization tools.'
							) }
						</p>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<img src={ imagePath + 'feature-photon-med.jpg' }
							srcSet={ `${ imagePath }feature-photon-sm.jpg 600w, ${ imagePath }feature-photon-med.jpg 770w, ${ imagePath }feature-photon-lrg.jpg 1200w` }
							className="jp-jetpack-connect__feature-image" alt={ __( "Jetpack's photon serves up lightning fast, optimized images" ) } />

						<div className="jp-jetpack-connect__feature-list">
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's WordPress themes" ) } className="dops-section-header__label">
									{ __( 'Professional themes' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Find the perfect design for your site from hundreds of available themes.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's customization tools" ) } className="dops-section-header__label">
									{ __( 'Code-free customization' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Customize your site with endless widget options, image galleries, and embedded media.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's performance features" ) } className="dops-section-header__label">
									{ __( 'Speed up your site' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Deliver blazing fast images and video and improve site load times.' ) }
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<Card className="jp-jetpack-connect__feature jp-jetpack-connect__traffic">

					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title={ __( 'Drive more traffic to your site with Jetpack' ) }>
							{ __( 'Increase traffic and revenue' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __( 'Reach more people and earn money with automated marketing tools.' ) }
						</p>
						<div className="jp-jetpack-connect__header-img-container">
							<img
								src={ imagePath + 'long-clouds.svg' }
								width="1160" height="63"
								alt={ __( 'Decoration: Jetpack clouds', { context: 'Image alternate text.' } ) }
								className="jp-jetpack-connect__header-img"
							/> {/* defining width and height for IE here */}
							<img
								src={ imagePath + 'stat-bars.svg' }
								width="400"
								alt={ __( 'Decoration: Jetpack bar graph', { context: 'Image alternate text.' } ) }
								className="jp-jetpack-connect__header-img"
							/>
						</div>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<div className="jp-jetpack-connect__feature-list">
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's site stats feature" ) } className="dops-section-header__label">
									{ __( 'Track your growth' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Keep an eye on your success with simple, concise, and mobile-friendly stats.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's publicize features" ) } className="dops-section-header__label">
									{ __( 'Automated marketing' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Schedule social media posts in advance, show related content, and give better search results.' ) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's ads and PayPal features" ) } className="dops-section-header__label">
									{ __( 'Generate revenue' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __( 'Monetize your site with high-quality ads and take PayPal payments.' ) }
									</p>
								</div>
							</div>
						</div>

					</div>
				</Card>

				<Card className="jp-jetpack-connect__feature jp-jetpack-connect__security">

					<header className="jp-jetpack-connect__header">
						<h2 className="jp-jetpack-connect__container-subtitle" title={ __( 'Keep your site safe, 24/7' ) }>
							{ __( 'Keep your site safe, 24/7' ) }
						</h2>
						<p className="jp-jetpack-connect__description">
							{ __(
								'Automatic defense against hacks, malware, spam, data loss, and downtime.'
							) }
						</p>
					</header>

					<div className="jp-jetpack-connect__interior-container">
						<div className="jp-jetpack-connect__feature-list">
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's monitor feature" ) } className="dops-section-header__label">
									{ __( 'Monitor', { context: 'Header. Noun: Monitor is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __(
											'Be alerted about any unexpected downtime the moment it happens.'
										) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title={ __( "Jetpack's Protect features" ) } className="dops-section-header__label">
									{ __( 'Protect', { context: 'Header. Noun: Protect is a module of Jetpack.' } ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __(
											'Guard your site against brute force login attacks, spam, and harmful' +
											'malware injections.'
										) }
									</p>
								</div>
							</div>
							<div className="jp-jetpack-connect__feature-list-column">
								<h3 title="Jetpack's backup feature" className="dops-section-header__label">
									{ __( 'Backup and restore' ) }
								</h3>
								<div className="jp-jetpack-connect__feature-content">
									<p>
										{ __(
											'Automatic, real-time backups mean your entire site is always ready ' +
											'to be restored.'
										) }
									</p>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">
						{ __(
							'Join the millions of users who rely on Jetpack to enhance and secure their sites. ' +
							'We\'re passionate about WordPress and here to make your life easier.'
						) }
					</p>
					<ConnectButton from="landing-page-bottom">
						<p>
							<a href={ newAccountUrl } className="jp-jetpack-connect__link">
								{ __( 'No account? Create one for free.' ) }
							</a>
						</p>
					</ConnectButton>
				</Card>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			connectUrl: getConnectUrl( state )
		};
	}
)( JetpackConnect );
