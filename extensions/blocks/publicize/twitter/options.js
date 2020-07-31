/**
 * Publicize options specific to Twitter.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { RadioControl, ToggleControl, Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './editor.scss';

const PublicizeTwitterOptions = ( {
	connections,
	isTweetstorm,
	setTweetstorm,
	isTweetstormModeEnabled,
	setTweetstormModeEnabled,
} ) => {
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

	// @TODO: Implement. 🙂
	const openTwitterPreview = () => {};

	return (
		<>
			<h3 className="jetpack-publicize-twitter-options__heading">
				{ __( 'Twitter settings', 'jetpack' ) }
			</h3>
			<RadioControl
				selected={ isTweetstorm ? 'tweetstorm' : 'excerpt' }
				options={ [
					{ label: __( 'As an excerpt in a single tweet', 'jetpack' ), value: 'excerpt' },
					{ label: __( 'As a Twitter thread in multiple Tweets', 'jetpack' ), value: 'tweetstorm' },
				] }
				onChange={ tweetTypeChange }
			/>
			{ isTweetstorm && (
				<>
					<ToggleControl
						label={ __( 'Twitter thread editing mode', 'jetpack' ) }
						checked={ isTweetstormModeEnabled }
						onChange={ setTweetstormModeEnabled }
					/>
					<Button
						className="jetpack-publicize-twitter-options__preview"
						onClick={ openTwitterPreview }
						isSecondary
					>
						{ __( 'Preview Twitter Thread', 'jetpack' ) }
					</Button>
				</>
			) }
		</>
	);
};

export default compose( [
	withSelect( select => ( {
		connections: select( 'core/editor' ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
		isTweetstorm: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
		isTweetstormModeEnabled: select( 'jetpack/publicize' ).isTweetstormModeEnabled(),
	} ) ),
	withDispatch( dispatch => ( {
		setTweetstorm: value =>
			dispatch( 'core/editor' ).editPost( { meta: { jetpack_is_tweetstorm: value } } ),
		setTweetstormModeEnabled: dispatch( 'jetpack/publicize' ).setTweetstormModeEnabled,
	} ) ),
] )( PublicizeTwitterOptions );
