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
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import QuerySite from 'components/data/query-site';
import { Comments } from './comments';
import { Subscriptions } from './subscriptions';

export const Discussion = React.createClass( {
	displayName: 'DiscussionSettings',

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return <span />;
		}

		// Getting text data about modules and seeing if it's being searched for
		let list = [
			this.props.module( 'comments' ),
			this.props.module( 'subscriptions' )
		].map( function( m ) {
			if ( ! this.props.searchTerm ) {
				return true;
			}

			let text = [
				m.module,
				m.name,
				m.description,
				m.learn_more_button,
				m.long_description,
				m.search_terms,
				m.additional_search_queries,
				m.short_description,
				m.feature ? m.feature.toString() : ''
			].toString();

			return text.toLowerCase().indexOf( this.props.searchTerm ) > -1;
		}, this);

		let commentsSettings = (
			<Comments
				{ ...commonProps }
			/>
		);
		let subscriptionsSettings = (
			<Subscriptions
				{ ...commonProps }
				siteRawUrl={ this.props.siteRawUrl }
			/>
		);

		return (
			<div>
				<QuerySite />
				{ list[0] ? commentsSettings : '' }
				{ list[1] ? subscriptionsSettings : '' }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
			isDevMode: isDevMode( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name )
		}
	}
)( Discussion );
