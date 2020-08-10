/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import TweetDivider from './tweet-divider';
import './editor.scss';

/**
 * Intercepts the registration of all blocks, allowing us to add our Tweet divider
 * when it's needed.
 *
 * @param {object} blockSettings - The settings of the block being registered.
 *
 * @returns {object} The blockSettings, with our extra functionality inserted.
 */
const addTweetDivider = blockSettings => {
	const { edit } = blockSettings;

	return {
		...blockSettings,
		edit: props => <TweetDivider ChildEdit={ edit } childProps={ props } />,
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/publishing-tweetstorms', addTweetDivider );
