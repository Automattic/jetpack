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

/**
 * Internal dependencies
 */
import './editor.scss';

const PublicizeTwitterOptions = ( { connections, isTweetstorm, setTweetstorm } ) => {
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
				selected={ isTweetstorm ? 'tweetstorm' : 'excerpt' }
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
		isTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
	} ) ),
	withDispatch( dispatch => ( {
		setTweetstorm: value =>
			dispatch( 'core/editor' ).editPost( { meta: { jetpack_is_tweetstorm: value } } ),
	} ) ),
] )( PublicizeTwitterOptions );
