/**
 * External dependencies
 */
import { flatMap } from 'lodash';
import { Popover } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../shared/icons';

import './editor.scss';
import { __ } from '@wordpress/i18n';

const SUPPORTED_BLOCKS = {
	'core/heading': {
		contentAttributes: [ 'content' ],
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
	'core/verse': {
		contentAttributes: [ 'content' ],
	},
	'core/image': {
		contentAttributes: [ 'url' ],
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
		} = select( 'core/block-editor' );

		const supportedBlock = !! SUPPORTED_BLOCKS[ childProps.name ];
		const tweet = select( 'jetpack/publicize' ).getTweetForBlock( childProps.clientId );
		const isSelectedTweetBoundary =
			( tweet &&
				tweet.blocks.some( block => isBlockSelected( block.clientId ) ) &&
				tweet.blocks[ tweet.blocks.length - 1 ].clientId === childProps.clientId ) ||
			( isBlockSelected( childProps.clientId ) && ! supportedBlock );

		const computeSelector = element => {
			// We've found the block node, we can return now.
			if ( `block-${ childProps.clientId }` === element.id ) {
				return `#block-${ childProps.clientId }`;
			}

			const parent = element.parentNode;
			const index = Array.prototype.indexOf.call( parent.children, element );

			return computeSelector( parent ) + ` > :nth-child( ${ index + 1 } )`;
		};

		const styles =
			tweet &&
			tweet.boundaries
				.filter( boundary => 'end-of-line' === boundary.type )
				.map( boundary => {
					const line = document
						.getElementById( `block-${ childProps.clientId }` )
						.getElementsByTagName( 'li' )
						.item( boundary.line );
					return computeSelector( line );
				} );

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
			if ( findTagsInContent( [ 'strong', 'bold', 'em', 'i' ] ) ) {
				popoverWarnings.push( __( 'Twitter removes all text formatting.', 'jetpack' ) );
			}

			if ( findTagsInContent( [ 'a' ] ) ) {
				popoverWarnings.push( __( 'Links will be posted seperately.', 'jetpack' ) );
			}
		}

		const shouldShowPopover =
			! isTyping() &&
			! isDraggingBlocks() &&
			! isMultiSelecting() &&
			! hasMultiSelection() &&
			popoverWarnings.length > 0;

		return {
			isTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
			isSelectedTweetBoundary,
			boundaries: tweet && tweet.boundaries,
			blockStyles: styles || [],
			popoverWarnings,
			shouldShowPopover,
		};
	} ),
	withDispatch( ( dispatch, { childProps }, { select } ) => {
		return {
			updateTweets: () => {
				const topBlocks = select( 'core/editor' ).getBlocks();

				const computeTweetBlocks = ( blocks = [] ) => {
					return flatMap( blocks, ( block = {} ) => {
						if ( SUPPORTED_BLOCKS[ block.name ] ) {
							return block;
						}

						return computeTweetBlocks( block.innerBlocks );
					} );
				};

				const tweetBlocks = computeTweetBlocks( topBlocks );

				dispatch( 'jetpack/publicize' ).refreshTweets( tweetBlocks );
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
