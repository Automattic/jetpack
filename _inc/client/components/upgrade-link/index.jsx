/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import store from 'state/redux-store';

/**
 * Internal dependencies
 */
import { getSiteRawUrl, getAffiliateCode } from 'state/initial-state';

/**
 * Build the upgrade URL
 *
 * @param {string} source        Context where this URL is clicked.
 * @param {string} siteRawUrl    RAW Url for this site.
 * @param {string} affiliateCode The affiliate code.
 *
 * @return {string} Upgrade URL with source, site, and affiliate code added.
 */
const buildUpgradeUrl = ( source, siteRawUrl, affiliateCode ) => `https://jetpack.com/redirect/?${ [
	`source=${ source }`,
	`site=${ siteRawUrl }`,
	...( '' === affiliateCode ? [] : [ `aff=${ affiliateCode }` ] ),
].join( '&' ) }`;

/**
 * Return an upgrade URL
 *
 * @param {string} source Context where this URL is clicked.
 *
 * @return {string} Upgrade URL with source, site, and affiliate code added.
 */
export const getUpgradeUrl = source => {
	const state = store.getState();
	return buildUpgradeUrl( source, getSiteRawUrl( state ), getAffiliateCode( state ) );
};

/**
 * Component to render a link.
 */
class UpgradeLink extends PureComponent {

	static propTypes = {
		source: PropTypes.string.isRequired,

		// Connected
		siteRawUrl: PropTypes.string.isRequired,
		affiliateCode: PropTypes.string.isRequired,
	};

	render() {
		return (
			<a
				href={ buildUpgradeUrl( this.props.source, this.props.siteRawUrl, this.props.affiliateCode ) }
				target="_blank"
				rel="noopener noreferrer"
				>
					{ this.props.children }
			</a>
		);
	}
}

export default connect(
	state => ( {
		siteRawUrl: getSiteRawUrl( state ),
		affiliateCode: getAffiliateCode( state ),
	} )
)( UpgradeLink );
