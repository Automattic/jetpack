/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';
import SectionHeader from 'components/section-header';

/**
 * Internal dependencies
 */
import { getConnectUrl } from 'state/initial-state';
import { imagePath } from 'constants';

const JetpackConnect = React.createClass( {
	render: function() {
		return (
			<div className="jp-connection__container">
				<h1 className="jp-connection__container-title" title="Please connect Jetpack to WordPress.com">Please Connect Jetpack</h1>

				<Card className="jp-connection__cta">
					<p className="jp-connection__description">Please connect to or create a WordPress.com account to enable Jetpack, including powerful security, traffic, and customization services.</p>
					<Button className="is-primary jp-connection__button" onClick={ getConnectUrl( this.props ) } >Connect Jetpack</Button>
					<p><a href="#" className="jp-connection__link">No WordPress.com account? Create one for free.</a></p>
				</Card>

				<Card className="jp-connection__feature jp-connection__traffic">

					<header className="jp-connection__header">
						<h2 className="jp-connection__container-subtitle" title="Drive more traffic to your site with Jetpack">Drive more traffic to your site</h2>
						<p className="jp-connection__feature-description">Jetpack has many traffic and engagement tools to help you get more viewers 
to your site and keep them there.</p>

						<div className="jp-connection__header-img-container">
							<img src={ imagePath + "long-clouds.svg" } width="1160" height="63" alt="Decoration: Jetpack clouds" className="jp-connection__header-img" /> {/* defining width and height for IE here */}
							<img src={ imagePath + "stat-bars.svg" } width="400" alt="Decoration: Jetpack bar graph" className="jp-connection__header-img" />
						</div>
					</header>

					<div className="jp-connection__interior-container">
						<div className="jp-connection__feature-list">
							<div className="jp-connection__feature-list-column">
								<h3 title="Jetpack's Publicize feature" className="dops-section-header__label">Publicize</h3>
								<div className="jp-connection__feature-content">
									<h4 className="jp-connection__feature-content-title" title="Automated social marketing">Automated social marketing.</h4>
									<p>Use Publicize to automatically share your posts with friends, followers, and the world.</p>
								</div>
							</div>
							<div className="jp-connection__feature-list-column">
								<h3 title="Jetpack's Sharing and Like features" className="dops-section-header__label">Sharing &amp; Like Buttons</h3>
								<div className="jp-connection__feature-content">
									<h4 className="jp-connection__feature-content-title" title="Build a community">Build a community</h4>
									<p>Give visitors the tools to share and subscribe to your content.</p>
								</div>
							</div>
							<div className="jp-connection__feature-list-column">
								<h3 title="Jetpack's Related Posts feature" className="dops-section-header__label">Related Posts</h3>
								<div className="jp-connection__feature-content">
									<h4 className="jp-connection__feature-content-title" title="Increase page views">Increase page views</h4>
									<p>Keep visitors engaged by giving them more to share and read with Related Posts.</p>
								</div>
							</div>
						</div>

						<h2 className="jp-connection__container-subtitle" title="Track your growth">Track your growth</h2>
						<p className="jp-connection__feature-description">Jetpack harnesses the power of WordPress.com to show you detailed insights about your visitors, what they’re reading, and where they’re coming from.</p>

						<img src={ imagePath + "stats-example-med.png" } 
							srcSet={ `${imagePath}stats-example-sm.png 500w, ${imagePath}stats-example-med.png 600w, ${imagePath}stats-example-lrg.png 900w` }
							className="jp-connection__feature-image"  alt="Jetpack statistics and traffic insights graph" />

					</div>
				</Card>
				<Card className="jp-connection__feature jp-connection__security">

					<header className="jp-connection__header">
						<h2 className="jp-connection__container-subtitle" title="Site security and peace of mind with Jetpack">Site security and peace of mind</h2>

						<div className="jp-connection__header-img-container">
							<img src={ imagePath + "long-clouds.svg" } width="1160" height="63" alt="" className="jp-connection__header-img" /> {/* defining width and height for IE here */}
							<img src={ imagePath + "jp-shield.svg" } width="180" alt="" className="jp-connection__header-img" />
						</div>
					</header>

					<div className="jp-connection__interior-container">
						testing
					</div>

				</Card>

			</div>
		);
	}
} );

export default connect( ( state ) => {
	return state;
} )( JetpackConnect );
