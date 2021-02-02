/**
 * WordPress dependencies
 */
import { createBlocksFromInnerBlocksTemplate, pasteHandler } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { _x, __ } from '@wordpress/i18n';

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

function podcastSection( { episodeTrack, feedUrl, coverImage } ) {
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
							url: image ? image : coverImage,
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
	const sectionBlocks = [
		[
			'core/heading',
			{
				level: 3,
				content: _x( 'Summary', 'noun: summary of a podcast episode', 'jetpack' ),
				placeholder: __( 'Podcast episode title', 'jetpack' ),
			},
		],
	];

	const summaryBlocks = pasteHandler( { HTML: episodeTrack.description_html, mode: 'BLOCKS' } );

	if ( summaryBlocks.length ) {
		sectionBlocks.push( ...summaryBlocks );
	} else {
		sectionBlocks.push( [
			'core/paragraph',
			{
				placeholder: __( 'Podcast episode summary', 'jetpack' ),
			},
		] );
	}

	return [ 'core/group', {}, sectionBlocks ];
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
function episodeBasicTemplate( {
	spotifyShowUrl,
	spotifyImageUrl,
	episodeTrack = {},
	feedUrl,
	coverImage,
} ) {
	const tpl = [ podcastSection( { episodeTrack, feedUrl, coverImage } ) ];

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
