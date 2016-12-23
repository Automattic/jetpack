/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Discussion from 'discussion';
import Engagement from 'engagement/index.jsx';
import Security from 'security/index.jsx';
import Traffic from 'traffic';
import Appearance from 'appearance/index.jsx';
import Writing from 'writing/index.jsx';

export default React.createClass( {
	displayName: 'SearchableSettings',

	render() {
		var commonProps = {
			route: this.props.route,
			searchTerm: this.props.searchTerm
		};

		return (
			<div>
				<Engagement
					active={ ( '/engagement' === this.props.route.path ) }
					{ ...commonProps }
				/>
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
				<Appearance
					route={ this.props.route }
					active={ ( '/appearance' === this.props.route.path ) }
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
			</div>
		);
	}
} );

