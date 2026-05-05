import apiFetch from '@wordpress/api-fetch';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	PanelBody,
	Placeholder,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { convertSecondsToTimeCode } from '../../shared/components/media-player-control/utils';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import metadata from './block.json';
import { microphone } from './icons';

const AUDIO_VIDEO_MIME_TYPES = [ 'audio', 'video' ];

const EPISODE_TYPE_OPTIONS = [
	{ label: __( 'Full', 'jetpack' ), value: 'full' },
	{ label: __( 'Trailer', 'jetpack' ), value: 'trailer' },
	{ label: __( 'Bonus', 'jetpack' ), value: 'bonus' },
];

const TRANSCRIPT_TYPE_OPTIONS = [
	{ label: 'WebVTT (text/vtt)', value: 'text/vtt' },
	{ label: 'HTML (text/html)', value: 'text/html' },
	{ label: 'SRT (application/srt)', value: 'application/srt' },
	{ label: 'JSON (application/json)', value: 'application/json' },
];

const PERSON_ROW_STYLE = { marginBottom: '1em' };

function PeopleEditor( { people, onChange } ) {
	const updatePerson = ( index, patch ) => {
		const next = people.map( ( person, i ) => ( i === index ? { ...person, ...patch } : person ) );
		onChange( next );
	};
	const removePerson = index => onChange( people.filter( ( _, i ) => i !== index ) );
	const addPerson = () => onChange( [ ...people, { name: '', role: '', href: '', img: '' } ] );

	return (
		<>
			{ people.map( ( person, index ) => (
				<div
					className="jetpack-podcast-episode__person-editor"
					key={ index }
					style={ PERSON_ROW_STYLE }
				>
					<TextControl
						label={ __( 'Name', 'jetpack' ) }
						value={ person.name || '' }
						onChange={ name => updatePerson( index, { name } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Role', 'jetpack' ) }
						help={ __( 'e.g. host, guest, producer.', 'jetpack' ) }
						value={ person.role || '' }
						onChange={ role => updatePerson( index, { role } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Profile URL', 'jetpack' ) }
						type="url"
						value={ person.href || '' }
						onChange={ href => updatePerson( index, { href } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Image URL', 'jetpack' ) }
						type="url"
						value={ person.img || '' }
						onChange={ img => updatePerson( index, { img } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<Button variant="link" isDestructive onClick={ () => removePerson( index ) }>
						{ __( 'Remove person', 'jetpack' ) }
					</Button>
				</div>
			) ) }
			<Button variant="secondary" onClick={ addPerson }>
				{ __( 'Add person', 'jetpack' ) }
			</Button>
		</>
	);
}

export default function PodcastEpisodeEdit( { attributes, setAttributes, context } ) {
	const validated = getValidatedAttributes( metadata.attributes, attributes );
	const {
		mediaId,
		mediaUrl,
		mediaType,
		mediaMimeType,
		episodeNumber,
		seasonNumber,
		episodeType,
		explicit,
		guid,
		duration,
		transcriptUrl,
		transcriptType,
		chaptersUrl,
		locationName,
		license,
		licenseUrl,
		people,
		showPoster,
	} = validated;

	const { postId, postType } = context || {};

	const [ postTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	const [ postExcerpt ] = useEntityProp( 'postType', postType, 'excerpt', postId );
	const [ featuredId ] = useEntityProp( 'postType', postType, 'featured_media', postId );
	const [ postDate ] = useEntityProp( 'postType', postType, 'date', postId );
	const [ authorId ] = useEntityProp( 'postType', postType, 'author', postId );

	const { thumbnailUrl, postAuthor } = useSelect(
		select => {
			const core = select( coreStore );
			const media = featuredId ? core.getMedia( featuredId ) : null;
			const author = authorId ? core.getUser( authorId ) : null;
			return {
				thumbnailUrl: media?.source_url || '',
				postAuthor: author?.name || '',
			};
		},
		[ featuredId, authorId ]
	);

	const blockProps = useBlockProps();
	const [ uploadError, setUploadError ] = useState( null );

	const onSelectMedia = async media => {
		if ( ! media || ! media.url ) {
			return;
		}
		const type = media.type === 'video' ? 'video' : 'audio';

		// `fileLength` on the attachment shim is the ID3 `length_formatted` string
		// (e.g. "12:00"); fall back to computing from seconds if only a number is
		// available.
		const nextDuration =
			duration ||
			( typeof media.fileLength === 'string' && media.fileLength ) ||
			( media.duration ? convertSecondsToTimeCode( media.duration ) : '' );

		const immediate = {
			mediaId: media.id,
			mediaUrl: media.url,
			mediaType: type,
			mediaMimeType: media.mime || media.mime_type || '',
			mediaSize: media.filesizeInBytes || media.filesize_in_bytes || undefined,
			duration: nextDuration,
		};
		setAttributes( immediate );

		if ( ! media.id ) {
			return;
		}

		// Backfill empty audio metadata from the attachment's ID3 data
		// (parsed by WordPress via wp_read_audio_metadata on upload).
		try {
			const attachment = await apiFetch( { path: `/wp/v2/media/${ media.id }` } );
			const details = attachment?.media_details || {};

			const patch = {};

			if ( ! immediate.duration && details.length_formatted ) {
				patch.duration = details.length_formatted;
			} else if ( ! immediate.duration && details.length ) {
				patch.duration = convertSecondsToTimeCode( details.length );
			}

			if ( ! immediate.mediaSize && details.filesize ) {
				patch.mediaSize = Number( details.filesize );
			}

			if ( ! immediate.mediaMimeType && attachment?.mime_type ) {
				patch.mediaMimeType = attachment.mime_type;
			}

			if ( Object.keys( patch ).length ) {
				setAttributes( patch );
			}
		} catch {
			// Non-fatal: media metadata is a nice-to-have, the user can fill fields manually.
		}
	};

	if ( ! postId || ! postType ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ microphone }
					label={ __( 'Podcast Episode', 'jetpack' ) }
					instructions={ __(
						'This block reads the title, cover art, excerpt, and author from the post it lives in. Drop it inside a podcast post or singular template.',
						'jetpack'
					) }
				/>
			</div>
		);
	}

	if ( ! mediaUrl ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ microphone }
					labels={ {
						title: __( 'Podcast Episode', 'jetpack' ),
						instructions: __(
							'Upload an audio or video file, or pick one from the media library, to use as the episode audio.',
							'jetpack'
						),
					} }
					accept="audio/*,video/*"
					allowedTypes={ AUDIO_VIDEO_MIME_TYPES }
					onSelect={ onSelectMedia }
					onError={ message => setUploadError( message ) }
					notices={
						uploadError ? <div className="components-notice is-error">{ uploadError }</div> : null
					}
				/>
			</div>
		);
	}

	const dateSettings = getDateSettings();

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<MediaReplaceFlow
						mediaId={ mediaId }
						mediaURL={ mediaUrl }
						allowedTypes={ AUDIO_VIDEO_MIME_TYPES }
						accept="audio/*,video/*"
						onSelect={ onSelectMedia }
						onError={ message => setUploadError( message ) }
						name={ __( 'Replace audio/video', 'jetpack' ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Episode', 'jetpack' ) }>
					<TextControl
						label={ __( 'Season number', 'jetpack' ) }
						type="number"
						min={ 0 }
						value={ seasonNumber ?? '' }
						onChange={ value =>
							setAttributes( {
								seasonNumber: value === '' ? undefined : Number( value ),
							} )
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Episode number', 'jetpack' ) }
						type="number"
						min={ 0 }
						value={ episodeNumber ?? '' }
						onChange={ value =>
							setAttributes( {
								episodeNumber: value === '' ? undefined : Number( value ),
							} )
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<SelectControl
						label={ __( 'Episode type', 'jetpack' ) }
						value={ episodeType }
						options={ EPISODE_TYPE_OPTIONS }
						onChange={ value => setAttributes( { episodeType: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Explicit content', 'jetpack' ) }
						checked={ !! explicit }
						onChange={ value => setAttributes( { explicit: value } ) }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show cover art', 'jetpack' ) }
						help={ __( 'Use the post’s featured image as cover art.', 'jetpack' ) }
						checked={ !! showPoster }
						onChange={ value => setAttributes( { showPoster: value } ) }
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={ __( 'Audio', 'jetpack' ) }>
					<TextControl
						label={ __( 'Duration', 'jetpack' ) }
						help={ __( 'Formatted as HH:MM:SS or MM:SS.', 'jetpack' ) }
						value={ duration }
						onChange={ value => setAttributes( { duration: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Episode GUID', 'jetpack' ) }
						help={ __( 'Optional permanent identifier for this episode.', 'jetpack' ) }
						value={ guid || '' }
						onChange={ value => setAttributes( { guid: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</PanelBody>

				<PanelBody title={ __( 'Podcasting 2.0', 'jetpack' ) } initialOpen={ false }>
					<TextControl
						label={ __( 'Transcript URL', 'jetpack' ) }
						type="url"
						value={ transcriptUrl }
						onChange={ value => setAttributes( { transcriptUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<SelectControl
						label={ __( 'Transcript format', 'jetpack' ) }
						value={ transcriptType }
						options={ TRANSCRIPT_TYPE_OPTIONS }
						onChange={ value => setAttributes( { transcriptType: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Chapters URL', 'jetpack' ) }
						help={ __( 'Link to a JSON chapters file (podcast:chapters).', 'jetpack' ) }
						type="url"
						value={ chaptersUrl }
						onChange={ value => setAttributes( { chaptersUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Location', 'jetpack' ) }
						help={ __( 'Human-readable location associated with this episode.', 'jetpack' ) }
						value={ locationName }
						onChange={ value => setAttributes( { locationName: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'License', 'jetpack' ) }
						help={ __( 'e.g. CC-BY-4.0 or all rights reserved.', 'jetpack' ) }
						value={ license }
						onChange={ value => setAttributes( { license: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'License URL', 'jetpack' ) }
						type="url"
						value={ licenseUrl }
						onChange={ value => setAttributes( { licenseUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<BaseControl __nextHasNoMarginBottom>
						<BaseControl.VisualLabel>
							{ __( 'People', 'jetpack' ) }
						</BaseControl.VisualLabel>
						<PeopleEditor
							people={ people }
							onChange={ value => setAttributes( { people: value } ) }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>

			<article className="jetpack-podcast-episode">
				{ showPoster && thumbnailUrl && (
					<figure className="jetpack-podcast-episode__poster">
						<img src={ thumbnailUrl } alt="" />
					</figure>
				) }
				<div className="jetpack-podcast-episode__body">
					{ ( seasonNumber || episodeNumber || episodeType !== 'full' || explicit ) && (
						<p className="jetpack-podcast-episode__meta-line">
							{ seasonNumber ? (
								<span className="jetpack-podcast-episode__season">
									{ /* translators: %d: season number. */ }
									{ sprintf( __( 'Season %d', 'jetpack' ), seasonNumber ) }
								</span>
							) : null }
							{ episodeNumber ? (
								<span className="jetpack-podcast-episode__episode-number">
									{ /* translators: %d: episode number. */ }
									{ sprintf( __( 'Episode %d', 'jetpack' ), episodeNumber ) }
								</span>
							) : null }
							{ episodeType === 'trailer' && (
								<span className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--trailer">
									{ __( 'Trailer', 'jetpack' ) }
								</span>
							) }
							{ episodeType === 'bonus' && (
								<span className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--bonus">
									{ __( 'Bonus', 'jetpack' ) }
								</span>
							) }
							{ explicit && (
								<span
									className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--explicit"
									title={ __( 'Explicit content', 'jetpack' ) }
								>
									{ __( 'E', 'jetpack' ) }
								</span>
							) }
						</p>
					) }

					<h3 className="jetpack-podcast-episode__title">
						{ postTitle || __( 'Untitled episode', 'jetpack' ) }
					</h3>

					{ ( postAuthor || postDate || duration ) && (
						<p className="jetpack-podcast-episode__byline">
							{ postAuthor && (
								<span className="jetpack-podcast-episode__author">{ postAuthor }</span>
							) }
							{ postDate && (
								<time className="jetpack-podcast-episode__date">
									{ dateI18n( dateSettings.formats.date, postDate ) }
								</time>
							) }
							{ duration && (
								<span className="jetpack-podcast-episode__duration">{ duration }</span>
							) }
						</p>
					) }

					<div className="jetpack-podcast-episode__player">
						{ mediaType === 'video' ? (
							<video
								src={ mediaUrl }
								controls
								preload="metadata"
								poster={ showPoster ? thumbnailUrl : undefined }
								data-mime={ mediaMimeType || undefined }
							/>
						) : (
							<audio src={ mediaUrl } controls preload="metadata" />
						) }
					</div>

					{ postExcerpt && (
						<p className="jetpack-podcast-episode__summary">{ postExcerpt }</p>
					) }
				</div>
			</article>
		</div>
	);
}
