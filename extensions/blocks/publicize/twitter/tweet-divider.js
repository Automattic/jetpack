/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import { Popover } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../shared/icons';
import { SUPPORTED_BLOCKS } from './index';

import './editor.scss';

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
		const {
			boundaries,
			childProps,
			contentAttributesChanged,
			currentAnnotations,
			isTweetstorm,
			updateAnnotations,
			updateTweets,
		} = this.props;

		if ( ! isTweetstorm ) {
			return;
		}

		if ( ! SUPPORTED_BLOCKS[ childProps.name ] ) {
			return;
		}

		if ( contentAttributesChanged( prevProps.childProps.attributes, childProps.attributes ) ) {
			updateTweets();
		}

		if (
			currentAnnotations.length !==
				boundaries.filter( boundary => 'normal' === boundary.type ).length ||
			! isEqual( prevProps.boundaries, boundaries )
		) {
			updateAnnotations();
		}
	}

	render() {
		const {
			ChildEdit,
			childProps,
			isTweetstorm,
			isSelectedTweetBoundary,
			blockStyles,
			shouldShowPopover,
			popoverWarnings,
		} = this.props;

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
						{ shouldShowPopover && (
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
				{ blockStyles && (
					<style type="text/css">
						{ blockStyles.map(
							selector =>
								`${ selector }::after {
								content: "";
								background: #0009;
								width: 3px;
								display: inline-block;
								margin: 1px;
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
			isTyping,
			isDraggingBlocks,
			isMultiSelecting,
			hasMultiSelection,
			isBlockSelected,
			isCaretWithinFormattedText,
		} = select( 'core/block-editor' );

		const { getTweetsForBlock } = select( 'jetpack/publicize' );

		const isTweetstorm = select( 'core/editor' ).getEditedPostAttribute( 'meta' )
			.jetpack_is_tweetstorm;
		const tweets = getTweetsForBlock( childProps.clientId );

		const contentAttributesChanged = ( prevAttributes, attributes ) => {
			const attributeNames = SUPPORTED_BLOCKS[ childProps.name ].contentAttributes;
			return ! isEqual(
				attributeNames.map( attribute => ( { attribute, content: prevAttributes[ attribute ] } ) ),
				attributeNames.map( attribute => ( { attribute, content: attributes[ attribute ] } ) )
			);
		};

		const currentAnnotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
			childProps.clientId
		);

		// If this block isn't assigned any tweets, we can skip the rest.
		if ( ! isTweetstorm || ! tweets || tweets.length === 0 ) {
			return {
				isTweetstorm,
				isSelectedTweetBoundary: false,
				contentAttributesChanged,
				boundaries: [],
				blockStyles: [],
				popoverWarnings: [],
				shouldShowPopover: false,
				currentAnnotations,
			};
		}

		const supportedBlock = !! SUPPORTED_BLOCKS[ childProps.name ];

		const lastTweet = tweets[ tweets.length - 1 ];
		// The current block is the selected tweet boundary when either of these are true:
		// - The current block is selected, and it's not a block type we support.
		// - It's the last block in the last tweet, and the currently selected block is also in the same set of tweets.
		const isSelectedTweetBoundary =
			( isBlockSelected( childProps.clientId ) && ! supportedBlock ) ||
			( lastTweet.blocks[ lastTweet.blocks.length - 1 ].clientId === childProps.clientId &&
				tweets.some( tweet => tweet.blocks.some( block => isBlockSelected( block.clientId ) ) ) );

		const boundaries = tweets.filter( tweet => tweet.boundary ).map( tweet => tweet.boundary );

		const computeSelector = element => {
			// We've found the block node, we can return now.
			if ( `block-${ childProps.clientId }` === element.id ) {
				return `#block-${ childProps.clientId }`;
			}

			const parent = element.parentNode;
			const index = Array.prototype.indexOf.call( parent.children, element );

			return computeSelector( parent ) + ` > :nth-child( ${ index + 1 } )`;
		};

		const blockElement = document.getElementById( `block-${ childProps.clientId }` );
		const blockStyles = boundaries
			.filter( boundary => 'end-of-line' === boundary.type )
			.map( boundary => {
				// When switching from code to visual editor, the block may not've been re-added to the DOM yet.
				if ( ! blockElement ) {
					return false;
				}

				const line = blockElement.getElementsByTagName( 'li' ).item( boundary.line );

				// Confirm that the line hasn't been deleted since this boundary was calculated.
				if ( line ) {
					return computeSelector( line );
				}

				return false;
			} )
			.filter( style => !! style );

		const findTagsInContent = tags => {
			if ( 0 === tags.length ) {
				return false;
			}

			if ( ! SUPPORTED_BLOCKS[ childProps.name ].contentAttributes ) {
				return false;
			}

			const tagRegexp = new RegExp( `<(${ tags.join( '|' ) })( |>|/>)`, 'gi' );
			return SUPPORTED_BLOCKS[ childProps.name ].contentAttributes.reduce( ( found, attribute ) => {
				if ( found ) {
					return true;
				}

				return tagRegexp.test( childProps.attributes[ attribute ] );
			}, false );
		};

		const popoverWarnings = [];
		if ( ! supportedBlock ) {
			popoverWarnings.push( __( 'This block is not exportable to Twitter', 'jetpack' ) );
		} else {
			if ( 'core/gallery' === childProps.name && childProps.attributes.images.length > 4 ) {
				popoverWarnings.push( __( 'Twitter displays the first four images.', 'jetpack' ) );
			}

			if ( findTagsInContent( [ 'strong', 'bold', 'em', 'i', 'sup', 'sub', 'span', 's' ] ) ) {
				popoverWarnings.push( __( 'Twitter removes all text formatting.', 'jetpack' ) );
			}

			if ( findTagsInContent( [ 'a' ] ) ) {
				popoverWarnings.push( __( 'Links will be posted seperately.', 'jetpack' ) );
			}
		}

		// Don't show the popover when the user is clearly doing something else.
		const shouldShowPopover =
			! isTyping() &&
			! isDraggingBlocks() &&
			! isMultiSelecting() &&
			! hasMultiSelection() &&
			! isCaretWithinFormattedText() &&
			popoverWarnings.length > 0;

		return {
			isTweetstorm,
			isSelectedTweetBoundary,
			contentAttributesChanged,
			boundaries,
			blockStyles,
			popoverWarnings,
			shouldShowPopover,
			currentAnnotations,
		};
	} ),
	withDispatch( ( dispatch, { childProps, contentAttributesChanged }, { select } ) => {
		return {
			updateTweets: () => dispatch( 'jetpack/publicize' ).refreshTweets(),
			updateAnnotations: () => {
				// If this block hasn't been assigned to a tweet, skip annotation work.
				const tweets = select( 'jetpack/publicize' ).getTweetsForBlock( childProps.clientId );
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

				if ( contentAttributesChanged( blockCopy.attributes, childProps.attributes ) ) {
					return;
				}

				// Remove any existing annotations in this block.
				const annotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
					childProps.clientId
				);
				annotations.forEach( annotation => {
					if ( annotation.source === 'jetpack-tweetstorm' ) {
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
					}
				} );
			},
		};
	} ),
] )( TweetDivider );
