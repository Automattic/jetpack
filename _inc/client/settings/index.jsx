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
import Sharing from 'sharing/index.jsx';

export default React.createClass( {
	displayName: 'SearchableSettings',

	render() {
		const commonProps = {
			route: this.props.route,
			searchTerm: this.props.searchTerm
		};

		return (
			<div className="jp-settings-container">
				<div className="jp-no-results">
					{ commonProps.searchTerm
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
				<Discussion
					siteRawUrl={ this.props.siteRawUrl }
					active={ ( '/discussion' === this.props.route.path ) }
					{ ...commonProps }
				/>
				<Security
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ ( '/security' === this.props.route.path ) }
					{ ...commonProps }
				/>
				<Traffic
					siteRawUrl={ this.props.siteRawUrl }
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ ( '/traffic' === this.props.route.path ) }
					{ ...commonProps }
				/>
				<Writing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ (
						'/writing' === this.props.route.path
						|| '/settings' === this.props.route.path
					) }
					{ ...commonProps }
				/>
				<Sharing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ ( '/sharing' === this.props.route.path ) }
					{ ...commonProps }
				/>
			</div>
		);
	}
} );
