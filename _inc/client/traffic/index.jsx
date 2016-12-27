/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import QuerySite from 'components/data/query-site';
import { SEO } from './seo';
import { SiteStats } from './site-stats';

export const Traffic = React.createClass( {
	displayName: 'TrafficSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<SEO
					settings={ this.props.settings }
					getModule={ this.props.module }
					configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
				/>
				<SiteStats
					settings={ this.props.settings }
					getModule={ this.props.module }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			settings: getSettings( state )
		}
	}
)( Traffic );
