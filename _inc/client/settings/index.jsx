/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Discussion from 'discussion';
import Security from 'security/index.jsx';
import Traffic from 'traffic';
import Writing from 'writing/index.jsx';

export default React.createClass( {
	displayName: 'SearchableSettings',

	render() {
		var commonProps = {
			route: this.props.route,
			searchTerm: this.props.searchTerm
		};

		return (
			<div className="jp-settings-container">
				<div className="jp-no-results">
					{ false !== commonProps.searchTerm
						? __(
							'No search results found for %(term)s',
							{
								args: {
									term: commonProps.searchTerm
								}
							}
						)
						: __( 'Enter a search term to find settings or close search.' )
					}
				</div>
				{
					(
						'/settings' === this.props.route.path
						|| '/writing' === this.props.route.path
					) &&
					<Writing
						siteAdminUrl={ this.props.siteAdminUrl }
						{ ...commonProps }
					/>
				}
				{ '/traffic' === this.props.route.path &&
					<Traffic
						siteRawUrl={ this.props.siteRawUrl }
						siteAdminUrl={ this.props.siteAdminUrl }
						{ ...commonProps }
					/>
				}
				{ '/discussion' === this.props.route.path &&
					<Discussion
						siteRawUrl={ this.props.siteRawUrl }
						{ ...commonProps }
					/>
				}
				{ '/security' === this.props.route.path &&
					<Security
						siteAdminUrl={ this.props.siteAdminUrl }
						{ ...commonProps }
					/>
				}
			</div>
		);
	}
} );
