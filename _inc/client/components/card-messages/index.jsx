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
		case 'infinite-scroll':
			return (
				<div>
					{ props.desc }
					<p className="jp-form-setting-explanation">
						{
							__( "The current version of your theme, {{strong}}%(theme)s{{/strong}}, doesn't support Infinite Scroll.", {
									args: {
										theme: props.themeData.name
									},
									components: {
										strong: <strong />
									}
								}
							)
						}
						{ ' ' }
						{
							props.themeData.hasUpdate
								? __( "Check if the {{a}}latest version{{/a}} adds support.", {
										components: {
											a: <a href={ props.siteAdminUrl + 'update-core.php' } className="jetpack-js-stop-propagation" />
										}
									}
								  )
								: ''
						}
					</p>
				</div>
			);
			break;

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