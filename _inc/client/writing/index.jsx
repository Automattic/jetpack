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
import { userCanEditPosts } from 'state/initial-state';
import { isModuleFound as _isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import Composing from './composing';
import Media from './media';
import CustomContentTypes from './custom-content-types';
import ThemeEnhancements from './theme-enhancements';
import PostByEmail from './post-by-email';

export const Writing = React.createClass( {
	displayName: 'WritingSettings',

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};

		let found = [
			'markdown',
			'after-the-deadline',
			'custom-content-types',
			'photon',
			'carousel',
			'post-by-email',
			'infinite-scroll',
			'minileven'
		].some( this.props.isModuleFound );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! found ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<Composing { ...commonProps } userCanEditPosts={ this.props.userCanEditPosts } />
				<Media { ...commonProps } />
				<CustomContentTypes { ...commonProps } />
				<ThemeEnhancements { ...commonProps } />
				<PostByEmail { ...commonProps } />
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
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			userCanEditPosts: userCanEditPosts( state )
		};
	}
)( Writing );
