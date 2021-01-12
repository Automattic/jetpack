/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../../shared/block-icons';

// Templates.

function spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) {
	return [
		'core/image',
		{
			url: spotifyImageUrl,
			linkDestination: 'none',
			href: spotifyShowUrl,
			align: 'center',
			width: 165,
			height: 40,
			className: 'is-spotify-podcast-badge',
		},
	];
}

function podcastSection( { episodeTrack } ) {
	const { image, link } = episodeTrack;

	return [
		'core/columns',
		{
			align: 'wide',
		},
		[
			[
				'core/column',
				{ width: '30%' },
				[
					[
						'core/image',
						{
							url: image ? image : null,
						},
					],
				],
			],
			[
				'core/column',
				{ width: '70%' },
				[
					[
						'jetpack/podcast-player',
						{
							customPrimaryColor: getIconColor(),
							hexPrimaryColor: getIconColor(),
							url: link,
						},
					],
				],
			],
		],
	];
}

function podcastSummarySection( { episodeTrack } ) {
	return [
		'core/group',
		{},
		[
			[
				'core/heading',
				{
					level: 3,
					content: 'Summary',
					placeholder: __( 'Podcast episode title', 'jetpack' ),
				},
			],
			[
				'core/paragraph',
				{
					placeholder: __( 'Podcast episode summary', 'jetpack' ),
					content: episodeTrack.description,
				},
			],
		],
	];
}

function podcastConversationSection() {
	return [
		'jetpack/conversation',
		{},
		[
			[
				'core/heading',
				{
					level: 3,
					content: 'Transcription',
					placeholder: __( 'Podcast episode transcription', 'jetpack' ),
				},
			],
			[
				'jetpack/dialogue',
				{
					placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					participantSlug: 'participant-0',
					hasBoldStyle: true,
				},
			],
			[
				'jetpack/dialogue',
				{
					placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					participantSlug: 'participant-1',
					hasBoldStyle: true,
				},
			],
			[
				'jetpack/dialogue',
				{
					placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					participantSlug: 'participant-2',
					hasBoldStyle: true,
				},
			],
		],
	];
}

/*
 * Template parts
 */
function episodeBasicTemplate( { spotifyShowUrl, spotifyImageUrl, episodeTrack = {} } ) {
	const tpl = [ podcastSection( { episodeTrack } ) ];

	if ( spotifyShowUrl && spotifyImageUrl ) {
		tpl.push( spotifyTemplate( { spotifyShowUrl, spotifyImageUrl } ) );
	}

	tpl.push( podcastSummarySection( { episodeTrack } ) );
	tpl.push( podcastConversationSection() );

	return tpl;
}

export function basicTemplate( params ) {
	return createBlocksFromInnerBlocksTemplate( episodeBasicTemplate( params ) );
}

export function spotifyBadgeTemplate( params ) {
	if ( ! params.spotifyImageUrl || ! params.spotifyShowUrl ) {
		return;
	}

	return createBlocksFromInnerBlocksTemplate( [ spotifyTemplate( params ) ] );
}
