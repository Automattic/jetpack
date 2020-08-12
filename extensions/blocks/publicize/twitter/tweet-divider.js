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

/**
 * Class that wraps around the edit function for all blocks, adding various
 * enhancements to the block as they're needed.
 */
class TweetDivider extends Component {
	componentDidMount() {
		this.props.updateTweets();
	}

	componentDidUpdate( prevProps ) {
		const { boundaries, childProps, updateTweets, updateAnnotations } = this.props;

		if ( prevProps.childProps.attributes.content !== childProps.attributes.content ) {
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
	withDispatch( ( dispatch, { isTweetstorm, childProps }, { select } ) => {
		if ( ! isTweetstorm ) {
			return {
				updateTweets: () => {},
				updateAnnotations: () => {},
			};
		}

		return {
			updateTweets: () => {
				const topBlocks = select( 'core/editor' ).getBlocks();
				const selectedBlocks = select( 'core/block-editor' ).getSelectedBlockClientIds();

				const SUPPORTED_BLOCKS = [ 'core/paragraph' ];

				const computeTweetBlocks = ( blocks = [] ) => {
					return flatMap( blocks, ( block = {} ) => {
						if ( SUPPORTED_BLOCKS.includes( block.name ) ) {
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
					dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
						blockClientId: childProps.clientId,
						source: 'jetpack-tweetstorm',
						richTextIdentifier: 'content',
						range: boundary,
					} );
				} );
			},
		};
	} ),
] )( TweetDivider );
