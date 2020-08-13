/**
 * External dependencies
 */
import { flatMap } from 'lodash';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../shared/icons';

import './editor.scss';

const SUPPORTED_BLOCKS = {
	'core/heading': {
		contentAttributes: [ 'content' ],
	},
	'core/paragraph': {
		contentAttributes: [ 'content' ],
	},
	'core/quote': {
		contentAttributes: [ 'value', 'citation' ],
	},
	'core/verse': {
		contentAttributes: [ 'content' ],
	},
};

/**
 * Class that wraps around the edit function for all blocks, adding various
 * enhancements to the block as they're needed.
 */
class TweetDivider extends Component {
	componentDidMount() {
		const { isTweetstorm, updateTweets } = this.props;
		if ( isTweetstorm ) {
			updateTweets();
		}
	}

	componentDidUpdate( prevProps ) {
		const { boundaries, childProps, isTweetstorm, updateTweets, updateAnnotations } = this.props;

		if ( ! isTweetstorm ) {
			return;
		}

		if ( ! SUPPORTED_BLOCKS[ childProps.name ] ) {
			return;
		}

		// Check if any of the attributes of the child block that contain content have changed.
		const changed = SUPPORTED_BLOCKS[ childProps.name ].contentAttributes.reduce(
			( changeDetected, attribute ) => {
				if ( changeDetected ) {
					return true;
				}

				if ( childProps.attributes[ attribute ] !== prevProps.childProps.attributes[ attribute ] ) {
					return true;
				}

				return false;
			},
			false
		);

		if ( changed ) {
			updateTweets();
		}

		if ( prevProps.boundaries !== boundaries ) {
			updateAnnotations();
		}
	}

	render() {
		const { ChildEdit, childProps, isTweetstorm, isSelectedTweetBoundary } = this.props;

		if ( ! isTweetstorm ) {
			return <ChildEdit { ...childProps } />;
		}

		return (
			<>
				<ChildEdit { ...childProps } />
				{ isSelectedTweetBoundary && (
					<div className="jetpack-publicize-twitter__tweet-divider">
						<div className="jetpack-publicize-twitter__tweet-divider-icon">
							<SocialServiceIcon serviceName="twitter" />
						</div>
					</div>
				) }
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { childProps } ) => {
		const selectedBlocks = select( 'core/block-editor' ).getSelectedBlockClientIds();
		const tweet = select( 'jetpack/publicize' ).getTweetForBlock( childProps.clientId );
		const selectedBlockClientId = selectedBlocks.length === 1 && selectedBlocks[ 0 ];
		const isSelectedTweetBoundary =
			tweet &&
			tweet.blocks.some( block => block.clientId === selectedBlockClientId ) &&
			tweet.blocks[ tweet.blocks.length - 1 ].clientId === childProps.clientId;
		return {
			isTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
			isSelectedTweetBoundary,
			boundaries: tweet && tweet.boundaries,
		};
	} ),
	withDispatch( ( dispatch, { childProps }, { select } ) => {
		return {
			updateTweets: () => {
				const topBlocks = select( 'core/editor' ).getBlocks();
				const selectedBlocks = select( 'core/block-editor' ).getSelectedBlockClientIds();

				const computeTweetBlocks = ( blocks = [] ) => {
					return flatMap( blocks, ( block = {} ) => {
						if ( SUPPORTED_BLOCKS[ block.name ] ) {
							return block;
						}
						return computeTweetBlocks( block.innerBlocks );
					} );
				};

				const tweetBlocks = computeTweetBlocks( topBlocks );

				dispatch( 'jetpack/publicize' ).refreshTweets( tweetBlocks, selectedBlocks );
			},
			updateAnnotations: () => {
				const annotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
					childProps.clientId
				);
				annotations.forEach( annotation => {
					if ( annotation.source === 'jetpack-tweetstorm' ) {
						dispatch( 'core/annotations' ).__experimentalRemoveAnnotation( annotation.id );
					}
				} );

				const tweet = select( 'jetpack/publicize' ).getTweetForBlock( childProps.clientId );
				if ( ! tweet ) {
					return;
				}

				tweet.boundaries.forEach( boundary => {
					const { container, ...range } = boundary;
					dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
						blockClientId: childProps.clientId,
						source: 'jetpack-tweetstorm',
						richTextIdentifier: container,
						range,
					} );
				} );
			},
		};
	} ),
] )( TweetDivider );
