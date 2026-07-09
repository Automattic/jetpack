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
	ExternalLink,
	PanelBody,
	Placeholder,
	SelectControl,
	TextareaControl,
	TextControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _x, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { usePodcastSettings } from '../../dashboard/hooks/use-podcast-settings';
import metadata from './block.json';
import { microphone } from './icons';
import { getValidatedAttributes } from './util/get-validated-attributes';
import { convertSecondsToTimeCode } from './util/time-code';

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
	episodeNumber?: number;
	seasonNumber?: number;
	episodeType?: 'full' | 'trailer' | 'bonus';
	explicit?: boolean;
	duration?: string;
	transcriptUrl?: string;
	transcriptType?: string;
	chaptersUrl?: string;
	chaptersType?: string;
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
}

interface EditProps {
	attributes: PodcastEpisodeAttributes;
	setAttributes: ( patch: Partial< PodcastEpisodeAttributes > ) => void;
	context?: {
		postId?: number;
		postType?: string;
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
					className={ clsx( 'jetpack-podcast-episode__person-editor', {
						'jetpack-podcast-episode__person-editor--alt': index % 2 === 1,
					} ) }
					key={ index }
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
	const validated = useMemo(
		() => getValidatedAttributes( metadata.attributes, attributes ) as PodcastEpisodeAttributes,
		[ attributes ]
	);
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
		chaptersType,
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
	const [ featuredImageId ] = useEntityProp< number >(
		'postType',
		postType,
		'featured_media',
		postId
	);
	// `post_excerpt` is the show notes — feed `<description>` / `<itunes:summary>`
	// read from here. Bound to the same REST field as the sidebar Excerpt panel
	// so the two controls stay in sync.
	const [ postExcerpt, setPostExcerpt ] = useEntityProp< string >(
		'postType',
		postType,
		'excerpt',
		postId
	);

	const { data: podcastSettings } = usePodcastSettings();
	const showCoverUrl = podcastSettings?.podcasting_image || '';

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

	const featuredImageUrl = useSelect(
		select => {
			if ( ! featuredImageId ) {
				return '';
			}
			const media = (
				select( coreStore ) as {
					getMedia: ( id: number ) => { source_url?: string } | null;
				}
			 ).getMedia( featuredImageId );
			return media?.source_url || '';
		},
		[ featuredImageId ]
	);

	// Editor preview mirrors the PHP chain: episode override → featured image → show cover.
	const coverArtUrl = coverArt?.url || featuredImageUrl || showCoverUrl;

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
				media_details?: { length_formatted?: string; length?: number };
				mime_type?: string;
			};
			const details = attachment?.media_details || {};

			const patch: Partial< PodcastEpisodeAttributes > = {};

			if ( ! immediate.duration && details.length_formatted ) {
				patch.duration = details.length_formatted;
			} else if ( ! immediate.duration && details.length ) {
				patch.duration = convertSecondsToTimeCode( details.length );
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
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Show notes', 'jetpack-podcast' ) }
						help={ __(
							'Episode description shown in Apple Podcasts, Spotify, and Pocket Casts. Synced with the post’s Excerpt.',
							'jetpack-podcast'
						) }
						value={ postExcerpt || '' }
						onChange={ setPostExcerpt }
						rows={ 4 }
					/>
					<TextControl
						label={ __( 'Season number', 'jetpack-podcast' ) }
						type="number"
						min={ 1 }
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
						min={ 1 }
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
						help={ __(
							'Display cover art alongside the player on the post page. Cover art stays in schema metadata either way.',
							'jetpack-podcast'
						) }
						checked={ !! showPoster }
						onChange={ value => setAttributes( { showPoster: value } ) }
						__nextHasNoMarginBottom
					/>
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
										<Button
											variant="secondary"
											className={ clsx( 'jetpack-podcast-episode__cover-button', {
												'jetpack-podcast-episode__cover-button--empty': ! coverArtUrl,
											} ) }
											onClick={ open }
											aria-label={
												coverArt?.url
													? __( 'Replace cover art', 'jetpack-podcast' )
													: _x( 'Set episode cover art', '', 'jetpack-podcast' )
											}
										>
											{ coverArtUrl ? (
												<img src={ coverArtUrl } alt="" />
											) : (
												<span>{ __( 'Set episode cover art', 'jetpack-podcast' ) }</span>
											) }
										</Button>
										{ coverArt?.url && (
											<div className="jetpack-podcast-episode__cover-actions">
												<Button variant="link" onClick={ open }>
													{ __( 'Replace', 'jetpack-podcast' ) }
												</Button>
												<Button
													variant="link"
													isDestructive
													onClick={ () => setAttributes( { coverArt: {} } ) }
												>
													{ __( 'Remove', 'jetpack-podcast' ) }
												</Button>
											</div>
										) }
									</div>
								) }
							/>
						</MediaUploadCheck>
						<p className="components-base-control__help">
							{ __(
								'Defaults to the post’s featured image, then the show cover art from Settings → Writing → Podcasting.',
								'jetpack-podcast'
							) }
						</p>
					</BaseControl>
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
					<BaseControl __nextHasNoMarginBottom>
						<BaseControl.VisualLabel>
							{ __( 'Chapters', 'jetpack-podcast' ) }
						</BaseControl.VisualLabel>
						<p className="components-base-control__help">
							{ __(
								'Link to a chapters JSON file hosted on a public URL. Podcasting 2.0 players fetch the file directly and display chapter markers in their UI.',
								'jetpack-podcast'
							) }
						</p>
						<TextControl
							label={ __( 'Chapters file URL', 'jetpack-podcast' ) }
							type="url"
							value={ chaptersUrl || '' }
							onChange={ value => setAttributes( { chaptersUrl: value } ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						{ chaptersUrl && (
							<Button
								variant="link"
								isDestructive
								onClick={ () =>
									setAttributes( {
										chaptersUrl: '',
										chaptersType: 'application/json+chapters',
									} )
								}
							>
								{ __( 'Remove chapters URL', 'jetpack-podcast' ) }
							</Button>
						) }
						<SelectControl
							label={ __( 'Chapters file format', 'jetpack-podcast' ) }
							value={ chaptersType || 'application/json+chapters' }
							options={ [
								{
									label: __( 'JSON Chapters (application/json+chapters)', 'jetpack-podcast' ),
									value: 'application/json+chapters',
								},
								{
									label: __( 'JSON (application/json)', 'jetpack-podcast' ),
									value: 'application/json',
								},
							] }
							onChange={ value => setAttributes( { chaptersType: value } ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<ExternalLink href="https://github.com/Podcastindex-org/podcast-namespace/blob/main/chapters/jsonChapters.md">
							{ __( 'Learn about the chapters JSON format', 'jetpack-podcast' ) }
						</ExternalLink>
					</BaseControl>
				</PanelBody>

				<PanelBody title={ __( 'Metadata', 'jetpack-podcast' ) } initialOpen={ false }>
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
				</PanelBody>

				<PanelBody title={ __( 'Podcasting 2.0', 'jetpack-podcast' ) } initialOpen={ false }>
					<BaseControl __nextHasNoMarginBottom>
						<BaseControl.VisualLabel>
							{ __( 'Guests & credits', 'jetpack-podcast' ) }
						</BaseControl.VisualLabel>
						<p className="components-base-control__help">
							{ __(
								'Credit hosts, guests, and producers. Read by Podcasting 2.0 apps (Podverse, Fountain, Podcast Addict) and rendered as a credits list on the post page.',
								'jetpack-podcast'
							) }
						</p>
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
									{ _x( 'E', 'short label for explicit content', 'jetpack-podcast' ) }
								</span>
							) }
						</p>
					) }

					<h3 className="jetpack-podcast-episode__title">
						{ postTitle
							? decodeEntities( postTitle )
							: __( 'Untitled episode', 'jetpack-podcast' ) }
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
								preload="none"
								poster={ showPoster ? coverArtUrl : undefined }
								data-mime={ mediaMimeType || undefined }
							/>
						) : (
							<audio src={ mediaUrl } controls preload="none" />
						) }
					</div>
				</div>
			</article>
		</div>
	);
}
