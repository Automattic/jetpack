/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';

class UpgradeNoticeContent extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'This release of Jetpack brings major new features and big improvements to your WordPress site.' ) }
				</p>

				<h2>
					{ __( 'Speed up your site and its content' ) }
				</h2>

				<p>
					{ __( 'Sites that have large numbers of images can turn on Lazy Loading Images which significantly ' +
						"speeds up the site loading times for the end user. Instead of waiting for the entire site to load " +
						'Jetpack will instead show the site instantly and only download additional images when scrolling.' ) }
				</p>

				<p>
					{ __( 'We have also upgraded all our Premium plan customers to unlimited high-speed video storage ' +
						"(up from 13Gb) and significantly reduced the assets (CSS and JavaScript) that Jetpack downloads " +
						'when using features like infinite scroll and embedding rich content with shortcodes.' ) }
				</p>

				<h2>
					{ __( 'Fast and relevant search results' ) }
				</h2>

				<img src={ imagePath + 'Jetpack-Search-Placeholder.png' } alt={ __( 'Elasticsearch' ) } />

				<p>
					{ __( 'Our Elasticsearch-powered search service is now out of beta and availalbe to all Professional' +
						" plan customers. This replaces default WordPress search with a faster engine that returns more " +
						'relevant search results to your users.' ) }
				</p>

				<div className="jp-dialogue__cta-container">
					<Button
						primary={ true }
						href="https://jetpack.com/?p=27095"
					>
						{ __( 'Read the full announcement!' ) }
					</Button>

					<p className="jp-dialogue__note">
						<a href="https://jetpack.com/pricing">{ __( 'Compare paid plans' ) }</a>
					</p>
				</div>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'jetpack-search.svg' } width="250" alt={ __( 'Jetpack Search' ) } /> }
				title={ __( 'Major new features from Jetpack' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
			/>
		);
	}
}

JetpackDialogue.propTypes = {
	dismiss: PropTypes.func
};

export default UpgradeNoticeContent;
