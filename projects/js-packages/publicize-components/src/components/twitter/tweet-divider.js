import { SocialServiceIcon } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { isEqual } from 'lodash';

// Because the wp-annotations script isn't loaded by default in the block editor, importing
// it here tells webpack to add it as a dependency to be loaded before Jetpack blocks.
import '@wordpress/annotations';

import './editor.scss';

/**
 * Class that wraps around the edit function for all blocks, adding various
 * enhancements to the block as they're needed.
 */
class TweetDivider extends Component {
	componentDidMount() {
		const { isTweetStorm, updateTweets } = this.props;
		if ( isTweetStorm ) {
			updateTweets();
		}
	}

	componentDidUpdate( prevProps ) {
		const {
			boundaries,
			childProps,
			currentAnnotations,
			isTweetStorm,
			updateAnnotations,
			updateTweets,
			supportedBlockType,
			contentAttributesChanged,
		} = this.props;

		if ( ! isTweetStorm ) {
			return;
		}

		if ( ! supportedBlockType ) {
			return;
		}

		if ( contentAttributesChanged( prevProps.childProps, childProps ) ) {
			updateTweets();
		}

		if (
			currentAnnotations.length !==
				boundaries.filter( boundary => [ 'normal', 'line-break' ].includes( boundary.type ) )
					.length ||
			! isEqual( prevProps.boundaries, boundaries )
		) {
			updateAnnotations();
		}
	}

	render() {
		const {
			ChildEdit,
			childProps,
			isTweetStorm,
			isSelectedTweetBoundary,
			boundaryStylesSelectors,
			popoverWarnings,
		} = this.props;

		if ( ! isTweetStorm ) {
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
						{ popoverWarnings.length > 0 && (
							<Popover
								className="jetpack-publicize-twitter__tweet-divider-popover"
								focusOnMount={ false }
								position="bottom center"
							>
								<ol>
									{ popoverWarnings.map( ( warning, index ) => (
										<li
											key={ `jetpack-publicize-twitter__tweet-divider-popover-warning-${ index }` }
										>
											{ warning }
										</li>
									) ) }
								</ol>
							</Popover>
						) }
					</div>
				) }
				{ boundaryStylesSelectors && (
					<style type="text/css">
						{ boundaryStylesSelectors.map(
							selector =>
								`${ selector }::after {
								content: "";
								background: #0009;
								width: 3px;
								display: inline-block;
								margin: 0 1px;
							}
							.is-dark-theme ${ selector }::after {
								background: #fff9;
							}`
						) }
					</style>
				) }
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { childProps } ) => {
		const {
			isTweetStorm,
			getPopoverWarnings,
			getBoundariesForBlock,
			getBoundaryStyleSelectors,
			isSelectedTweetBoundary,
			getSupportedBlockType,
			contentAttributesChanged,
		} = select( 'jetpack/publicize' );

		const currentAnnotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
			childProps.clientId
		);

		return {
			isTweetStorm: isTweetStorm(),
			isSelectedTweetBoundary: isSelectedTweetBoundary( childProps ),
			boundaries: getBoundariesForBlock( childProps.clientId ),
			boundaryStylesSelectors: getBoundaryStyleSelectors( childProps.clientId ),
			popoverWarnings: getPopoverWarnings( childProps ),
			currentAnnotations,
			supportedBlockType: getSupportedBlockType( childProps.name ),
			contentAttributesChanged,
		};
	} ),
	withDispatch( ( dispatch, { childProps }, { select } ) => {
		return {
			updateTweets: () => dispatch( 'jetpack/publicize' ).refreshTweets(),
			updateAnnotations: () => {
				const { contentAttributesChanged, getTweetsForBlock } = select( 'jetpack/publicize' );
				// If this block hasn't been assigned to a tweet, skip annotation work.
				const tweets = getTweetsForBlock( childProps.clientId );
				if ( ! tweets || tweets.length === 0 ) {
					return;
				}

				// Check if the block content has changed since we sent it to the server for analysis.
				// If it has changed, don't update annotations, since it's better to leave them in the
				// same place, (even if that's incorrect), instead of moving them to a place where they
				// were correct a few seconds ago, but may be incorrect now.
				const blockCopy = tweets.reduce( ( foundBlock, tweet ) => {
					if ( foundBlock ) {
						return foundBlock;
					}

					return tweet.blocks.find( block => block.clientId === childProps.clientId );
				}, false );

				if ( contentAttributesChanged( blockCopy, childProps ) ) {
					return;
				}

				// Remove any existing annotations in this block.
				const annotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
					childProps.clientId
				);
				annotations.forEach( annotation => {
					if (
						[ 'jetpack-tweetstorm', 'jetpack-tweetstorm-line-break' ].includes( annotation.source )
					) {
						dispatch( 'core/annotations' ).__experimentalRemoveAnnotation( annotation.id );
					}
				} );

				const boundaries = tweets.filter( tweet => tweet.boundary ).map( tweet => tweet.boundary );

				// Add new annotations in the appropriate location.
				boundaries.forEach( boundary => {
					const { container, type, start, end } = boundary;
					if ( 'normal' === type ) {
						dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
							blockClientId: childProps.clientId,
							source: 'jetpack-tweetstorm',
							richTextIdentifier: container,
							range: { start, end },
						} );
					} else if ( 'line-break' === type ) {
						dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
							blockClientId: childProps.clientId,
							source: 'jetpack-tweetstorm-line-break',
							richTextIdentifier: container,
							range: { start, end },
						} );
					}
				} );
			},
		};
	} ),
] )( TweetDivider );
