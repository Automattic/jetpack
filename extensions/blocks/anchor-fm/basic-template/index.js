/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate, } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../../shared/block-icons';

/*
 * Template parts
 */
function buildPlayerSection( {
	podcastLink,
	spotifyShowUrl,
	spotifyImageUrl,
	track,
} ) {
	return [
		// Podcast player section.
		[ 'core/columns', {
			align: 'wide',
		}, [
			[ 'core/column', { width: '30%' }, [
				[ 'core/image', {
					url: track?.image ? track.image : null,
				} ],
			] ],
			[ 'core/column', { width: '70%' }, [
				[ 'jetpack/podcast-player', {
					customPrimaryColor: getIconColor(),
					hexPrimaryColor: getIconColor(),
					url: podcastLink,
				} ],
			] ],
		] ],

		// Spotfy Badge section.
		[ 'core/image', {
			url: spotifyImageUrl,
			linkDestination: 'none',
			href: spotifyShowUrl,
			align: 'center',
			width: 165,
			height: 40,
			className: 'is-spotify-podcast-badge',
		} ],

		// Summary section.
		[ 'core/group', {}, [
			[ 'core/heading', {
				content: __( 'Summary', 'jepack' ),
				placeholder: __( 'Podcast episode title', 'jetpack' ),
			} ],
			[ 'core/paragraph', {
				placeholder: __( 'Podcast episode summary', 'jetpack' ),
				content: track.description,
			} ],
		] ],

		// Transcription section.
		[ 'jetpack/conversation', {}, [
			[ 'core/heading', {
				level: 2,
				content: __( 'Transcription', 'jepack' ),
				placeholder: __( 'Podcast trancription', 'jetpack' ),
			} ],
			[ 'jetpack/dialogue', {
				slug: 'participan-0',
				placeholder: __( 'Participant 1', 'jetpack' ),
			} ],
			[ 'jetpack/dialogue', {
				slug: 'participan-1',
				placeholder: __( 'Participant 2', 'jetpack' ),
			} ],
			[ 'jetpack/dialogue', {
				slug: 'participan-2',
				placeholder: __( 'Participant 3', 'jetpack' ),
			} ],
		] ],
	];
}

export default ( params ) => createBlocksFromInnerBlocksTemplate( buildPlayerSection( params ) );