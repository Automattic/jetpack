/**
 * Publicize options specific to Twitter.
 */

import { NoticeList, RadioControl, PanelRow } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Because the wp-annotations script isn't loaded by default in the block editor, importing
// it here tells webpack to add it as a dependency to be loaded before Jetpack blocks.
import '@wordpress/annotations';

import './editor.scss';

export const PublicizeTwitterOptions = ( {
	connections,
	isTweetStorm,
	tweetStormLength,
	setTweetstorm,
	prePublish,
} ) => {
	const tweetTypeChange = useCallback(
		value => {
			if ( 'tweetstorm' === value ) {
				setTweetstorm( true );
			} else {
				setTweetstorm( false );
			}
		},
		[ setTweetstorm ]
	);

	if (
		! connections?.some( connection => 'twitter' === connection.service_name && connection.enabled )
	) {
		return null;
	}

	const generateLabel = ( label, help ) => {
		return (
			<>
				<strong>{ label }</strong>
				<br />
				{ help }
			</>
		);
	};

	const notices = [];

	if ( tweetStormLength >= 102 ) {
		notices.push( {
			id: 'jetpack-publicize-twitter-tweetstorm-too-long',
			status: 'error',
			content: __(
				'Only the first 100 tweets of this post will be published in the Twitter thread.',
				'jetpack'
			),
			isDismissible: false,
		} );
	} else if ( tweetStormLength >= 22 ) {
		notices.push( {
			id: 'jetpack-publicize-twitter-tweetstorm-a-bit-long',
			status: 'warning',
			content: __( 'This post will create a Twitter thread more than 20 tweets long.', 'jetpack' ),
			isDismissible: false,
		} );
	} else if ( prePublish && tweetStormLength <= 2 ) {
		notices.push( {
			id: 'jetpack-publicize-twitter-tweetstorm-too-short',
			status: 'warning',
			content: __(
				'None of the content in this post could be transformed into tweets, it may be better to share as a single tweet.',
				'jetpack'
			),
			isDismissible: false,
		} );
	}

	return (
		<PanelRow>
			<RadioControl
				label={ __( 'Twitter settings', 'jetpack' ) }
				selected={ isTweetStorm ? 'tweetstorm' : 'single' }
				options={ [
					{
						label: generateLabel(
							__( 'Single Tweet', 'jetpack' ),
							__( 'Share a link to this post to Twitter.', 'jetpack' )
						),
						value: 'single',
					},
					{
						label: generateLabel(
							__( 'Twitter Thread', 'jetpack' ),
							__( 'Share the content of this post as a Twitter thread.', 'jetpack' )
						),
						value: 'tweetstorm',
					},
				] }
				onChange={ tweetTypeChange }
			/>
			{ isTweetStorm && (
				<NoticeList className="jetpack-publicize-twitter-options__notices" notices={ notices } />
			) }
		</PanelRow>
	);
};

export default compose( [
	withSelect( select => {
		const { isTweetStorm, getTweetStorm } = select( 'jetpack/publicize' );
		return {
			connections: select( 'core/editor' ).getEditedPostAttribute(
				'jetpack_publicize_connections'
			),
			isTweetStorm: isTweetStorm(),
			tweetStormLength: getTweetStorm().length,
		};
	} ),
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
				dispatch( 'core/annotations' ).__experimentalRemoveAnnotationsBySource(
					'jetpack-tweetstorm-line-break'
				);
			}
		},
	} ) ),
] )( PublicizeTwitterOptions );
