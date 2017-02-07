/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getSiteAdminUrl } from 'state/initial-state';

export const CardMessages = props => {

	switch ( props.module ) {
		case 'sitemaps':
			return (
				<span>
					{ props.desc }
					{ <p className="jp-form-setting-explanation">
						{ __( 'Your site must be accessible by search engines for this feature to work properly. You can change this in {{a}}Reading Settings{{/a}}.', {
							components: {
								a: <a href={ props.siteAdminUrl + 'options-reading.php#blog_public' } className="jetpack-js-stop-propagation" />
							}
						} ) }
					</p> }
				</span>
			);

	}
};

export default connect(
	( state ) => {
		return {
			siteAdminUrl: getSiteAdminUrl( state )
		};
	}
)( CardMessages );