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
import SearchableModules from 'searchable-modules/index.jsx';
import Privacy from 'privacy/index.jsx';

export default class extends React.Component {
	static displayName = 'SearchableSettings';

	render() {
		const commonProps = {
			route: this.props.route,
			searchTerm: this.props.searchTerm,
			rewindStatus: this.props.rewindStatus,
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
					siteRawUrl={ this.props.siteRawUrl }
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
						'/writing' === this.props.route.path ||
						'/settings' === this.props.route.path
					) }
					{ ...commonProps }
				/>
				<Sharing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ ( '/sharing' === this.props.route.path ) }
					{ ...commonProps }
				/>
				<Privacy
					active={ ( '/privacy' === this.props.route.path ) }
					{ ...commonProps }
				/>
				<SearchableModules searchTerm={ this.props.searchTerm } />
			</div>
		);
	}
}
