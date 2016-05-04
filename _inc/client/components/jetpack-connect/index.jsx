/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';

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

						<div className="jp-connection__header-img-container">
							<img src={ imagePath + "long-clouds.svg" } width="1160" height="63" alt="Decoration: Jetpack clouds" className="jp-connection__header-img" /> {/* defining width and height for IE here */}
							<img src={ imagePath + "stat-bars.svg" } width="400" alt="Decoration: Jetpack bar graph" className="jp-connection__header-img" />
						</div>
					</header>

					<div className="jp-connection__interior-container">
						<div className="jp-connection__feature-list">
							<div className="jp-connection__feature-list-column">
								<h3 title="Automated social marketing">Automated social marketing</h3>
								<p>Use Publicize to automatically share your posts with friends, followers, and the world.</p>
							</div>
							<div className="jp-connection__feature-list-column">
								<h3 title="Build a community">Build a community</h3>
								<p>Give visitors the tools to share and subscribe to your content.</p>
							</div>
							<div className="jp-connection__feature-list-column">
								<h3 title="Increase page views">Increase page views</h3>
								<p>Keep visitors engaged by giving them more to share and read with Related Posts.</p>
							</div>
						</div>
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
