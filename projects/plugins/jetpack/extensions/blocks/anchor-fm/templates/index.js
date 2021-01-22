/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate } from '@wordpress/blocks';
import { select } from '@wordpress/data';
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

function podcastSection( { episodeTrack, feedUrl } ) {
	const { image, guid } = episodeTrack;

	return [
		'core/columns',
		{
			align: 'wide',
		},
		[
			[
				'core/column',
				{
					width: '30%',
				},
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
				{
					width: '70%',
					verticalAlignment: 'center',
				},
				[
					[
						'jetpack/podcast-player',
						{
							customPrimaryColor: getIconColor(),
							hexPrimaryColor: getIconColor(),
							url: feedUrl,
							selectedEpisodes: guid ? [ { guid } ] : [],
							showCoverArt: false,
							showEpisodeTitle: false,
							showEpisodeDescription: false,
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
	const conversationBlockName = 'jetpack/conversation';
	const isConversationBlockAvailable = select( 'core/blocks' ).getBlockType(
		conversationBlockName
	);

	// Check if `jetpack/conversation` block is register.
	if ( ! isConversationBlockAvailable ) {
		// When it is not, return a fallback core-blocks composition.
		return [
			'core/group',
			{},
			[
				[
					'core/heading',
					{
						level: 3,
						content: __( 'Transcription', 'jetpack' ),
						placeholder: __( 'Podcast episode transcription', 'jetpack' ),
					},
				],
				[
					'core/paragraph',
					{
						placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					},
				],
				[
					'core/paragraph',
					{
						placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					},
				],
				[
					'core/paragraph',
					{
						placeholder: __( 'Podcast episode dialogue', 'jetpack' ),
					},
				],
			],
		];
	}

	return [
		conversationBlockName,
		{},
		[
			[
				'core/heading',
				{
					level: 3,
					content: __( 'Transcription', 'jetpack' ),
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
function episodeBasicTemplate( { spotifyShowUrl, spotifyImageUrl, episodeTrack = {}, feedUrl } ) {
	const tpl = [ podcastSection( { episodeTrack, feedUrl } ) ];

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
