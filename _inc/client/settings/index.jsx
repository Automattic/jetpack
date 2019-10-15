/**
 * External dependencies
 *
 * @format
 */

import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Discussion from 'discussion';
import Performance from 'performance';
import Privacy from 'privacy';
import SearchableModules from 'searchable-modules';
import Security from 'security';
import Sharing from 'sharing';
import Traffic from 'traffic';
import Writing from 'writing';

export default class extends React.Component {
	static displayName = 'SearchableSettings';

	render() {
		const commonProps = {
			route: this.props.route,
			searchTerm: this.props.searchTerm,
			rewindStatus: this.props.rewindStatus,
			userCanManageModules: this.props.userCanManageModules,
		};

		return (
			<div className="jp-settings-container">
				<div className="jp-no-results">
					{ commonProps.searchTerm
						? __( 'No search results found for %(term)s', {
								args: {
									term: commonProps.searchTerm,
								},
						  } )
						: __( 'Enter a search term to find settings or close search.' ) }
				</div>
				<Security
					siteAdminUrl={ this.props.siteAdminUrl }
					siteRawUrl={ this.props.siteRawUrl }
					active={
						'/security' === this.props.route.path ||
						( '/settings' === this.props.route.path && commonProps.userCanManageModules )
					}
					{ ...commonProps }
				/>
				<Discussion
					siteRawUrl={ this.props.siteRawUrl }
					active={ '/discussion' === this.props.route.path }
					{ ...commonProps }
				/>
				<Performance active={ '/performance' === this.props.route.path } { ...commonProps } />
				<Traffic
					siteRawUrl={ this.props.siteRawUrl }
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ '/traffic' === this.props.route.path }
					{ ...commonProps }
				/>
				<Writing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={
						'/writing' === this.props.route.path ||
						( '/settings' === this.props.route.path && ! commonProps.userCanManageModules )
					}
					{ ...commonProps }
				/>
				<Sharing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ '/sharing' === this.props.route.path }
					{ ...commonProps }
				/>
				<Privacy active={ '/privacy' === this.props.route.path } { ...commonProps } />
				<SearchableModules searchTerm={ this.props.searchTerm } />
			</div>
		);
	}
}
