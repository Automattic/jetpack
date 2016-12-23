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
import { SEO } from './seo';
import { Ads } from './ads';
import { SiteStats } from './site-stats';
import { RelatedPosts } from './related-posts';
import { VerificationServices } from './verification-services';
import { getLastPostUrl } from 'state/initial-state';

export const Traffic = React.createClass( {
	displayName: 'TrafficSettings',

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
			this.props.module( 'seo-tools' ),
			this.props.module( 'wordads' ),
			this.props.module( 'stats' ),
			this.props.module( 'related-posts' ),
			this.props.module( 'verification-tools' )
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

		let seoSettings = (
			<SEO
				{ ...commonProps }
				configureUrl={ 'https://wordpress.com/settings/seo/' + this.props.siteRawUrl }
			/>
		);
		let adSettings = (
			<Ads
				{ ...commonProps }
				configureUrl={ 'https://wordpress.com/ads/earnings/' + this.props.siteRawUrl }
			/>
		);
		let statsSettings = (
			<SiteStats
				{ ...commonProps }
			/>
		);
		let relatedPostsSettings = (
			<RelatedPosts
				{ ...commonProps }
				configureUrl={ this.props.siteAdminUrl +
					'customize.php?autofocus[section]=jetpack_relatedposts' +
					'&return=' + encodeURIComponent( this.props.siteAdminUrl + 'admin.php?page=jetpack#/traffic' ) +
					'&url=' + encodeURIComponent( this.props.lastPostUrl ) }
			/>
		);
		let verificationSettings = (
			<VerificationServices
				{ ...commonProps }
			/>
		);

		return (
			<div>
				<QuerySite />
				{ list[0] ? seoSettings : '' }
				{ list[1] ? adSettings : '' }
				{ list[2] ? statsSettings : '' }
				{ list[3] ? relatedPostsSettings : '' }
				{ list[4] ? verificationSettings : '' }
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
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			lastPostUrl: getLastPostUrl( state )
		}
	}
)( Traffic );
