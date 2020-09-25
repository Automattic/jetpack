/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import TweetDivider from './tweet-divider';
import './editor.scss';

export const SUPPORTED_BLOCKS = {
	'core/gallery': {
		contentAttributes: [ 'images' ],
	},
	'core/heading': {
		contentAttributes: [ 'content' ],
	},
	'core/image': {
		contentAttributes: [ 'alt', 'url' ],
	},
	'core/list': {
		contentAttributes: [ 'values' ],
	},
	'core/paragraph': {
		contentAttributes: [ 'content' ],
	},
	'core/quote': {
		contentAttributes: [ 'value', 'citation' ],
	},
	'core/separator': {
		contentAttributes: [],
	},
	'core/spacer': {
		contentAttributes: [],
	},
	'core/verse': {
		contentAttributes: [ 'content' ],
	},
	'core/video': {
		contentAttributes: [ 'src' ],
	},
	'core/embed': {
		contentAttributes: [ 'url' ],
	},
	'jetpack/gif': {
		contentAttributes: [ 'giphyUrl' ],
	},
};

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

const TwitterThreadListener = ( { isTweetstorm, isTyping } ) => {
	if ( isTweetstorm ) {
		document.body.classList.add( 'jetpack-tweetstorm' );
	} else {
		document.body.classList.remove( 'jetpack-tweetstorm' );
	}

	if ( isTweetstorm && isTyping ) {
		document.body.classList.add( 'jetpack-tweetstorm-is-typing' );
	} else {
		document.body.classList.remove( 'jetpack-tweetstorm-is-typing' );
	}

	// We don't want to render anything for this component, just listen.
	return null;
};

export default compose( [
	withSelect( select => ( {
		isTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
		isTyping: select( 'core/block-editor' ).isTyping(),
	} ) ),
] )( TwitterThreadListener );
