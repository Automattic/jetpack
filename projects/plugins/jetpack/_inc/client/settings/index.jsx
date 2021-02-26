/**
 * External dependencies
 *
 * @format
 */

import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

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
import { withRouter } from 'react-router-dom';

class Settings extends React.Component {
	static displayName = 'SearchableSettings';

	render() {
		const commonProps = {
			searchTerm: this.props.searchTerm,
			rewindStatus: this.props.rewindStatus,
			userCanManageModules: this.props.userCanManageModules,
		};

		return (
			<div className="jp-settings-container">
				<div className="jp-no-results">
					{ commonProps.searchTerm
						? sprintf(
								/* translators: placeholder is a searchterm entered in searchform. */
								__( 'No search results found for %s', 'jetpack' ),
								commonProps.searchTerm
						  )
						: __( 'Enter a search term to find settings or close search.', 'jetpack' ) }
				</div>
				<Security
					siteAdminUrl={ this.props.siteAdminUrl }
					siteRawUrl={ this.props.siteRawUrl }
					active={
						'/security' === this.props.location.pathname ||
						( '/settings' === this.props.location.pathname && commonProps.userCanManageModules )
					}
					{ ...commonProps }
				/>
				<Discussion
					siteRawUrl={ this.props.siteRawUrl }
					active={ '/discussion' === this.props.location.pathname }
					{ ...commonProps }
				/>
				<Performance
					active={ '/performance' === this.props.location.pathname }
					{ ...commonProps }
				/>
				<Traffic
					siteRawUrl={ this.props.siteRawUrl }
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ '/traffic' === this.props.location.pathname }
					{ ...commonProps }
				/>
				<Writing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={
						'/writing' === this.props.location.pathname ||
						( '/settings' === this.props.location.pathname && ! commonProps.userCanManageModules )
					}
					{ ...commonProps }
				/>
				<Sharing
					siteAdminUrl={ this.props.siteAdminUrl }
					active={ '/sharing' === this.props.location.pathname }
					{ ...commonProps }
				/>
				<Privacy active={ '/privacy' === this.props.location.pathname } { ...commonProps } />
				<SearchableModules searchTerm={ this.props.searchTerm } />
			</div>
		);
	}
}

export default withRouter( Settings );
