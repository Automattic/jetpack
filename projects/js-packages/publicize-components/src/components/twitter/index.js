import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
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

export const SUPPORTED_CONTAINER_BLOCKS = [ 'core/column', 'core/columns', 'core/group' ];

/**
 * Intercepts the registration of all blocks, allowing us to add our Tweet divider
 * when it's needed.
 *
 * @param {object} blockSettings - The settings of the block being registered.
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

const TwitterThreadListener = ( { isTweetStorm, isTyping } ) => {
	if ( isTweetStorm ) {
		document.body.classList.add( 'jetpack-tweetstorm' );
	} else {
		document.body.classList.remove( 'jetpack-tweetstorm' );
	}

	if ( isTweetStorm && isTyping ) {
		document.body.classList.add( 'jetpack-tweetstorm-is-typing' );
	} else {
		document.body.classList.remove( 'jetpack-tweetstorm-is-typing' );
	}

	// We don't want to render anything for this component, just listen.
	return null;
};

export default compose( [
	withSelect( select => ( {
		isTweetStorm: select( 'jetpack/publicize' ).isTweetStorm(),
		isTyping: select( 'core/block-editor' ).isTyping(),
	} ) ),
] )( TwitterThreadListener );
