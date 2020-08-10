/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentTweet, getTweetForBlock } from './utils';
import { SocialServiceIcon } from '../../../shared/icons';

import './editor.scss';

/**
 * Class that wraps around the edit function for all blocks, adding various
 * enhancements to the block as they're needed.
 */
class TweetDivider extends Component {
	componentDidMount() {
		this.props.updateAnnotations();
	}

	componentDidUpdate( prevProps ) {
		const { childProps, updateAnnotations } = this.props;
		if ( prevProps.childProps.attributes.content !== childProps.attributes.content ) {
			updateAnnotations();
		}
	}

	render() {
		const {
			ChildEdit,
			childProps,
			jetpackIsTweetstorm,
			jetpackIsSelectedTweetBoundary,
		} = this.props;

		if ( ! jetpackIsTweetstorm ) {
			return <ChildEdit { ...childProps } />;
		}

		return (
			<>
				<ChildEdit { ...childProps } />
				{ jetpackIsSelectedTweetBoundary && (
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
		const jetpackCurrentTweet = getCurrentTweet( select );
		const jetpackIsSelectedTweetBoundary =
			jetpackCurrentTweet &&
			jetpackCurrentTweet.blocks[ jetpackCurrentTweet.blocks.length - 1 ].clientId ===
				childProps.clientId;
		return {
			jetpackIsTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' )
				.jetpack_is_tweetstorm,
			jetpackIsSelectedTweetBoundary,
		};
	} ),
	withDispatch( ( dispatch, { childProps }, { select } ) => {
		return {
			updateAnnotations: () => {
				const annotations = select( 'core/annotations' ).__experimentalGetAllAnnotationsForBlock(
					childProps.clientId
				);
				annotations.forEach( annotation => {
					if ( annotation.source === 'jetpack-tweetstorm' ) {
						dispatch( 'core/annotations' ).__experimentalRemoveAnnotation( annotation.id );
					}
				} );

				const tweet = getTweetForBlock( select, childProps.clientId );

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
