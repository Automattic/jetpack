/**
 * Publicize options specific to Twitter.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { RadioControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
// Because the wp-annotations script isn't loaded by default in the block editor, importing
// it here tells webpack to add it as a dependency to be loaded before Jetpack blocks.
import '@wordpress/annotations';

/**
 * Internal dependencies
 */
import './editor.scss';

const PublicizeTwitterOptions = ( { connections, isTweetStorm, setTweetstorm } ) => {
	if ( ! connections.some( connection => 'twitter' === connection.service_name ) ) {
		return null;
	}

	const tweetTypeChange = value => {
		if ( 'tweetstorm' === value ) {
			setTweetstorm( true );
		} else {
			setTweetstorm( false );
		}
	};

	return (
		<>
			<h3 className="jetpack-publicize-twitter-options__heading">
				{ __( 'Twitter settings', 'jetpack' ) }
			</h3>
			<RadioControl
				selected={ isTweetStorm ? 'tweetstorm' : 'single' }
				options={ [
					{
						label: __( 'Share your blog post as a link in a single tweet', 'jetpack' ),
						value: 'single',
					},
					{
						label: __(
							'Share your entire blog post as a Twitter thread in multiple Tweets',
							'jetpack'
						),
						value: 'tweetstorm',
					},
				] }
				onChange={ tweetTypeChange }
			/>
		</>
	);
};

export default compose( [
	withSelect( select => ( {
		connections: select( 'core/editor' ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
		isTweetStorm: select( 'jetpack/publicize' ).isTweetStorm(),
	} ) ),
	withDispatch( dispatch => ( {
		setTweetstorm: value => {
			dispatch( 'core/editor' ).editPost( { meta: { jetpack_is_tweetstorm: value } } );
			if ( value ) {
				dispatch( 'jetpack/publicize' ).refreshTweets();
			} else {
				// Clean up all of the tweet boundary annotations that might be left over.
				dispatch( 'core/annotations' ).__experimentalRemoveAnnotationsBySource(
					'jetpack-tweetstorm'
				);
			}
		},
	} ) ),
] )( PublicizeTwitterOptions );
