import apiFetch from '@wordpress/api-fetch';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	MediaUpload,
	MediaUploadCheck,
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
import metadata from './block.json';
import { microphone } from './icons/index.js';
import { getValidatedAttributes } from './util/get-validated-attributes.js';
import { convertSecondsToTimeCode } from './util/time-code.js';

interface Person {
	name?: string;
	role?: string;
	href?: string;
	img?: string;
}

interface CoverArt {
	id?: number;
	url?: string;
}

interface PodcastEpisodeAttributes {
	mediaId?: number;
	mediaUrl?: string;
	mediaType?: 'audio' | 'video';
	mediaMimeType?: string;
	mediaSize?: number;
	episodeNumber?: number;
	seasonNumber?: number;
	episodeType?: 'full' | 'trailer' | 'bonus';
	explicit?: boolean;
	duration?: string;
	transcriptUrl?: string;
	transcriptType?: string;
	chaptersUrl?: string;
	locationName?: string;
	license?: string;
	licenseUrl?: string;
	people?: Person[];
	showPoster?: boolean;
	coverArt?: CoverArt;
}

interface MediaAttachment {
	id?: number;
	url?: string;
	type?: string;
	mime?: string;
	mime_type?: string;
	fileLength?: string;
	duration?: number;
	filesizeInBytes?: number;
	filesize_in_bytes?: number;
}

interface EditProps {
	attributes: PodcastEpisodeAttributes;
	setAttributes: ( patch: Partial< PodcastEpisodeAttributes > ) => void;
	context?: {
		postId?: number;
		postType?: string;
		queryId?: number;
	};
}

const AUDIO_VIDEO_MIME_TYPES = [ 'audio', 'video' ];

const EPISODE_TYPE_OPTIONS = [
	{ label: __( 'Full', 'jetpack-podcast' ), value: 'full' },
	{ label: __( 'Trailer', 'jetpack-podcast' ), value: 'trailer' },
	{ label: __( 'Bonus', 'jetpack-podcast' ), value: 'bonus' },
];

const TRANSCRIPT_TYPE_OPTIONS = [
	{ label: __( 'WebVTT (text/vtt)', 'jetpack-podcast' ), value: 'text/vtt' },
	{ label: __( 'HTML (text/html)', 'jetpack-podcast' ), value: 'text/html' },
	{ label: __( 'SRT (application/srt)', 'jetpack-podcast' ), value: 'application/srt' },
	{ label: __( 'JSON (application/json)', 'jetpack-podcast' ), value: 'application/json' },
];

const PERSON_ROW_STYLE = { marginBottom: '1em' };

interface PeopleEditorProps {
	people: Person[];
	onChange: ( next: Person[] ) => void;
}

function PeopleEditor( { people, onChange }: PeopleEditorProps ) {
	const updatePerson = ( index: number, patch: Partial< Person > ) => {
		const next = people.map( ( person, i ) => ( i === index ? { ...person, ...patch } : person ) );
		onChange( next );
	};
	const removePerson = ( index: number ) => onChange( people.filter( ( _, i ) => i !== index ) );
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
						label={ __( 'Name', 'jetpack-podcast' ) }
						value={ person.name || '' }
						onChange={ name => updatePerson( index, { name } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Role', 'jetpack-podcast' ) }
						help={ __( 'e.g. host, guest, producer.', 'jetpack-podcast' ) }
						value={ person.role || '' }
						onChange={ role => updatePerson( index, { role } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Profile URL', 'jetpack-podcast' ) }
						type="url"
						value={ person.href || '' }
						onChange={ href => updatePerson( index, { href } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Image URL', 'jetpack-podcast' ) }
						type="url"
						value={ person.img || '' }
						onChange={ img => updatePerson( index, { img } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<Button variant="link" isDestructive onClick={ () => removePerson( index ) }>
						{ __( 'Remove person', 'jetpack-podcast' ) }
					</Button>
				</div>
			) ) }
			<Button variant="secondary" onClick={ addPerson }>
				{ __( 'Add person', 'jetpack-podcast' ) }
			</Button>
		</>
	);
}

export default function PodcastEpisodeEdit( { attributes, setAttributes, context }: EditProps ) {
	const validated = getValidatedAttributes(
		metadata.attributes,
		attributes
	) as PodcastEpisodeAttributes;
	const {
		mediaId,
		mediaUrl,
		mediaType,
		mediaMimeType,
		episodeNumber,
		seasonNumber,
		episodeType,
		explicit,
		duration,
		transcriptUrl,
		transcriptType,
		chaptersUrl,
		locationName,
		license,
		licenseUrl,
		people = [],
		showPoster,
		coverArt,
	} = validated;

	const { postId, postType } = context || {};

	const [ postTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	const [ postDate ] = useEntityProp( 'postType', postType, 'date', postId );
	const [ authorId ] = useEntityProp( 'postType', postType, 'author', postId );

	// Source the show-level cover from the same REST surface the dashboard
	// reads: /wp/v2/settings exposes `podcasting_image` (registered in
	// class-settings.php). No more localized window globals.
	const [ siteShowCover ] = useEntityProp< string >( 'root', 'site', 'podcasting_image' );
	const showCoverUrl = siteShowCover || '';

	const postAuthor = useSelect(
		select => {
			const author = authorId
				? (
						select( coreStore ) as { getUser: ( id: number ) => { name?: string } | null }
				   ).getUser( authorId )
				: null;
			return author?.name || '';
		},
		[ authorId ]
	);

	const coverArtUrl = coverArt?.url || showCoverUrl;

	const blockProps = useBlockProps();
	const [ uploadError, setUploadError ] = useState< string | null >( null );

	const onSelectMedia = async ( media: MediaAttachment | null ) => {
		if ( ! media || ! media.url ) {
			return;
		}
		const type: 'audio' | 'video' = media.type === 'video' ? 'video' : 'audio';

		// `fileLength` on the attachment shim is the ID3 `length_formatted` string
		// (e.g. "12:00"); fall back to computing from seconds if only a number is
		// available.
		const nextDuration =
			duration ||
			( typeof media.fileLength === 'string' && media.fileLength ) ||
			( media.duration ? convertSecondsToTimeCode( media.duration ) : '' );

		const immediate: Partial< PodcastEpisodeAttributes > = {
			mediaId: media.id,
			mediaUrl: media.url,
			mediaType: type,
			mediaMimeType: media.mime || media.mime_type || '',
			mediaSize: media.filesizeInBytes || media.filesize_in_bytes || undefined,
			duration: nextDuration || '',
		};
		setAttributes( immediate );

		if ( ! media.id ) {
			return;
		}

		// Backfill empty audio metadata from the attachment's ID3 data
		// (parsed by WordPress via wp_read_audio_metadata on upload).
		try {
			const attachment = ( await apiFetch( {
				path: `/wp/v2/media/${ media.id }`,
			} ) ) as {
				media_details?: { length_formatted?: string; length?: number; filesize?: number };
				mime_type?: string;
			};
			const details = attachment?.media_details || {};

			const patch: Partial< PodcastEpisodeAttributes > = {};

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
					label={ __( 'Podcast Episode', 'jetpack-podcast' ) }
					instructions={ __(
						'This block reads the title, author, and date from the post it lives in. Drop it inside a podcast post or singular template.',
						'jetpack-podcast'
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
						title: __( 'Podcast Episode', 'jetpack-podcast' ),
						instructions: __(
							'Upload an audio or video file, or pick one from the media library, to use as the episode audio.',
							'jetpack-podcast'
						),
					} }
					accept="audio/*,video/*"
					allowedTypes={ AUDIO_VIDEO_MIME_TYPES }
					onSelect={ onSelectMedia }
					onError={ ( message: string ) => setUploadError( message ) }
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
						onError={ ( message: string ) => setUploadError( message ) }
						name={ __( 'Replace audio/video', 'jetpack-podcast' ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Episode', 'jetpack-podcast' ) }>
					<TextControl
						label={ __( 'Season number', 'jetpack-podcast' ) }
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
						label={ __( 'Episode number', 'jetpack-podcast' ) }
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
						label={ __( 'Episode type', 'jetpack-podcast' ) }
						value={ episodeType }
						options={ EPISODE_TYPE_OPTIONS }
						onChange={ value =>
							setAttributes( { episodeType: value as 'full' | 'trailer' | 'bonus' } )
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Explicit content', 'jetpack-podcast' ) }
						checked={ !! explicit }
						onChange={ value => setAttributes( { explicit: value } ) }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show cover art', 'jetpack-podcast' ) }
						help={ __( 'Display cover art alongside the player.', 'jetpack-podcast' ) }
						checked={ !! showPoster }
						onChange={ value => setAttributes( { showPoster: value } ) }
						__nextHasNoMarginBottom
					/>
					{ showPoster && (
						<BaseControl __nextHasNoMarginBottom>
							<BaseControl.VisualLabel>
								{ __( 'Cover art', 'jetpack-podcast' ) }
							</BaseControl.VisualLabel>
							<MediaUploadCheck>
								<MediaUpload
									onSelect={ ( media: MediaAttachment ) =>
										setAttributes( {
											coverArt: media?.url ? { id: media.id, url: media.url } : {},
										} )
									}
									allowedTypes={ [ 'image' ] }
									value={ coverArt?.id }
									render={ ( { open }: { open: () => void } ) => (
										<div className="jetpack-podcast-episode__cover-picker">
											{ coverArtUrl && (
												<img
													src={ coverArtUrl }
													alt=""
													className="jetpack-podcast-episode__cover-preview"
												/>
											) }
											<Button variant="secondary" onClick={ open }>
												{ coverArt?.url && __( 'Replace cover art', 'jetpack-podcast' ) }
												{ ! coverArt?.url && __( 'Set episode cover art', 'jetpack-podcast' ) }
											</Button>
											{ coverArt?.url && (
												<Button
													variant="link"
													isDestructive
													onClick={ () => setAttributes( { coverArt: {} } ) }
												>
													{ __( 'Use show cover art', 'jetpack-podcast' ) }
												</Button>
											) }
										</div>
									) }
								/>
							</MediaUploadCheck>
							<p className="components-base-control__help">
								{ __(
									'Defaults to the show cover art set in Settings → Writing → Podcasting.',
									'jetpack-podcast'
								) }
							</p>
						</BaseControl>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Audio', 'jetpack-podcast' ) }>
					<TextControl
						label={ __( 'Duration', 'jetpack-podcast' ) }
						help={ __( 'Formatted as HH:MM:SS or MM:SS.', 'jetpack-podcast' ) }
						value={ duration }
						onChange={ value => setAttributes( { duration: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</PanelBody>

				<PanelBody title={ __( 'Podcasting 2.0', 'jetpack-podcast' ) } initialOpen={ false }>
					<TextControl
						label={ __( 'Transcript URL', 'jetpack-podcast' ) }
						type="url"
						value={ transcriptUrl }
						onChange={ value => setAttributes( { transcriptUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<SelectControl
						label={ __( 'Transcript format', 'jetpack-podcast' ) }
						value={ transcriptType }
						options={ TRANSCRIPT_TYPE_OPTIONS }
						onChange={ value => setAttributes( { transcriptType: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Chapters URL', 'jetpack-podcast' ) }
						help={ __( 'Link to a JSON chapters file (podcast:chapters).', 'jetpack-podcast' ) }
						type="url"
						value={ chaptersUrl }
						onChange={ value => setAttributes( { chaptersUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Location', 'jetpack-podcast' ) }
						help={ __(
							'Human-readable location associated with this episode.',
							'jetpack-podcast'
						) }
						value={ locationName }
						onChange={ value => setAttributes( { locationName: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'License', 'jetpack-podcast' ) }
						help={ __( 'e.g. CC-BY-4.0 or all rights reserved.', 'jetpack-podcast' ) }
						value={ license }
						onChange={ value => setAttributes( { license: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'License URL', 'jetpack-podcast' ) }
						type="url"
						value={ licenseUrl }
						onChange={ value => setAttributes( { licenseUrl: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<BaseControl __nextHasNoMarginBottom>
						<BaseControl.VisualLabel>{ __( 'People', 'jetpack-podcast' ) }</BaseControl.VisualLabel>
						<PeopleEditor
							people={ people }
							onChange={ value => setAttributes( { people: value } ) }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>

			<article className="jetpack-podcast-episode">
				{ showPoster && coverArtUrl && (
					<figure className="jetpack-podcast-episode__poster">
						<img src={ coverArtUrl } alt="" />
					</figure>
				) }
				<div className="jetpack-podcast-episode__body">
					{ ( seasonNumber || episodeNumber || episodeType !== 'full' || explicit ) && (
						<p className="jetpack-podcast-episode__meta-line">
							{ seasonNumber ? (
								<span className="jetpack-podcast-episode__season">
									{ sprintf(
										/* translators: %d: season number. */
										__( 'Season %d', 'jetpack-podcast' ),
										seasonNumber
									) }
								</span>
							) : null }
							{ episodeNumber ? (
								<span className="jetpack-podcast-episode__episode-number">
									{ sprintf(
										/* translators: %d: episode number. */
										__( 'Episode %d', 'jetpack-podcast' ),
										episodeNumber
									) }
								</span>
							) : null }
							{ episodeType === 'trailer' && (
								<span className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--trailer">
									{ __( 'Trailer', 'jetpack-podcast' ) }
								</span>
							) }
							{ episodeType === 'bonus' && (
								<span className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--bonus">
									{ __( 'Bonus', 'jetpack-podcast' ) }
								</span>
							) }
							{ explicit && (
								<span
									className="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--explicit"
									title={ __( 'Explicit content', 'jetpack-podcast' ) }
								>
									{ __( 'E', 'jetpack-podcast' ) }
								</span>
							) }
						</p>
					) }

					<h3 className="jetpack-podcast-episode__title">
						{ postTitle || __( 'Untitled episode', 'jetpack-podcast' ) }
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
								poster={ showPoster ? coverArtUrl : undefined }
								data-mime={ mediaMimeType || undefined }
							/>
						) : (
							<audio src={ mediaUrl } controls preload="metadata" />
						) }
					</div>

					<p className="jetpack-podcast-episode__notes-hint">
						{ __( 'Add episode show notes in the post content below.', 'jetpack-podcast' ) }
					</p>
				</div>
			</article>
		</div>
	);
}
