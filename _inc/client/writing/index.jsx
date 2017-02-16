/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import Composing from './composing';
import Media from './media';
import CustomContentTypes from './custom-content-types';
import ThemeEnhancements from './theme-enhancements';
import PostByEmail from './post-by-email';

export const Writing = React.createClass( {
	displayName: 'WritingSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<Composing />
				<Media />
				<CustomContentTypes />
				<ThemeEnhancements />
				<PostByEmail />
			</div>
		);
	}
} );
