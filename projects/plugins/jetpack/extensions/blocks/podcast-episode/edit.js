import apiFetch from '@wordpress/api-fetch';
import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaReplaceFlow,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	DateTimePicker,
	Dropdown,
	PanelBody,
	PanelRow,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

function formatSeconds( totalSeconds ) {
	const n = Number( totalSeconds );
	if ( ! n || Number.isNaN( n ) ) {
		return '';
	}
	const seconds = Math.floor( n % 60 );
	const minutes = Math.floor( ( n / 60 ) % 60 );
	const hours = Math.floor( n / 3600 );
	const pad = v => String( v ).padStart( 2, '0' );
	return hours > 0
		? `${ hours }:${ pad( minutes ) }:${ pad( seconds ) }`
		: `${ minutes }:${ pad( seconds ) }`;
}

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
					style={ { marginBottom: '1em' } }
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

export default function PodcastEpisodeEdit( { attributes, setAttributes, isSelected } ) {
	const validated = getValidatedAttributes( metadata.attributes, attributes );
	const {
		mediaId,
		mediaUrl,
		mediaType,
		mediaMimeType,
		title,
		summary,
		description,
		author,
		episodeNumber,
		seasonNumber,
		episodeType,
		explicit,
		publishDate,
		guid,
		duration,
		imageId,
		imageUrl,
		transcriptUrl,
		transcriptType,
		chaptersUrl,
		locationName,
		license,
		licenseUrl,
		people,
		showPoster,
	} = validated;

	const blockProps = useBlockProps( { className: 'wp-block-jetpack-podcast-episode' } );
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
			formatSeconds( media.duration );

		const immediate = {
			mediaId: media.id,
			mediaUrl: media.url,
			mediaType: type,
			mediaMimeType: media.mime || media.mime_type || '',
			mediaSize: media.filesizeInBytes || media.filesize_in_bytes || undefined,
			duration: nextDuration,
			title: title || media.title || '',
		};
		setAttributes( immediate );

		if ( ! media.id ) {
			return;
		}

		// Backfill any empty metadata fields from the attachment's ID3 data (parsed
		// by WordPress via wp_read_audio_metadata on upload). We never overwrite
		// values the user has already typed.
		try {
			const attachment = await apiFetch( { path: `/wp/v2/media/${ media.id }` } );
			const details = attachment?.media_details || {};
			const id3 = details.length_formatted || details.length ? details : details.audio || details;

			const patch = {};

			if ( ! immediate.duration && details.length_formatted ) {
				patch.duration = details.length_formatted;
			} else if ( ! immediate.duration && details.length ) {
				patch.duration = formatSeconds( details.length );
			}

			if ( ! title && id3?.title ) {
				patch.title = id3.title;
			}

			if ( ! author && id3?.artist ) {
				patch.author = id3.artist;
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

	const onSelectImage = image => {
		if ( ! image || ! image.url ) {
			return;
		}
		setAttributes( { imageId: image.id, imageUrl: image.url } );
	};

	const clearImage = () => setAttributes( { imageId: undefined, imageUrl: undefined } );

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
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectImage }
							allowedTypes={ [ 'image' ] }
							value={ imageId }
							render={ ( { open } ) => (
								<ToolbarButton aria-label={ __( 'Select cover art', 'jetpack' ) } onClick={ open }>
									{ imageUrl
										? __( 'Change cover art', 'jetpack' )
										: __( 'Add cover art', 'jetpack' ) }
								</ToolbarButton>
							) }
						/>
					</MediaUploadCheck>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Episode details', 'jetpack' ) }>
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
					<TextControl
						label={ __( 'Author / host', 'jetpack' ) }
						value={ author }
						onChange={ value => setAttributes( { author: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Duration', 'jetpack' ) }
						help={ __( 'Formatted as HH:MM:SS or MM:SS.', 'jetpack' ) }
						value={ duration }
						onChange={ value => setAttributes( { duration: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<BaseControl
						id="jetpack-podcast-episode-publish-date"
						label={ __( 'Publish date', 'jetpack' ) }
						__nextHasNoMarginBottom
					>
						<Dropdown
							popoverProps={ { placement: 'bottom-start' } }
							renderToggle={ ( { isOpen, onToggle } ) => (
								<Button
									variant="secondary"
									onClick={ onToggle }
									aria-expanded={ isOpen }
									__next40pxDefaultSize
								>
									{ publishDate
										? dateI18n( dateSettings.formats.datetime, publishDate )
										: __( 'Set date', 'jetpack' ) }
								</Button>
							) }
							renderContent={ () => (
								<DateTimePicker
									currentDate={ publishDate }
									onChange={ value => setAttributes( { publishDate: value } ) }
									is12Hour={ dateSettings.formats.time.toLowerCase().includes( 'a' ) }
								/>
							) }
						/>
						{ publishDate && (
							<Button
								variant="link"
								isDestructive
								onClick={ () => setAttributes( { publishDate: undefined } ) }
							>
								{ __( 'Clear date', 'jetpack' ) }
							</Button>
						) }
					</BaseControl>
					<TextControl
						label={ __( 'Episode GUID', 'jetpack' ) }
						help={ __( 'Optional permanent identifier for this episode.', 'jetpack' ) }
						value={ guid || '' }
						onChange={ value => setAttributes( { guid: value } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</PanelBody>

				<PanelBody title={ __( 'Cover art', 'jetpack' ) } initialOpen={ false }>
					<ToggleControl
						label={ __( 'Show cover art', 'jetpack' ) }
						checked={ !! showPoster }
						onChange={ value => setAttributes( { showPoster: value } ) }
						__nextHasNoMarginBottom
					/>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectImage }
							allowedTypes={ [ 'image' ] }
							value={ imageId }
							render={ ( { open } ) => (
								<PanelRow>
									<Button variant="secondary" onClick={ open } __next40pxDefaultSize>
										{ imageUrl
											? __( 'Replace cover art', 'jetpack' )
											: __( 'Select cover art', 'jetpack' ) }
									</Button>
									{ imageUrl && (
										<Button variant="link" isDestructive onClick={ clearImage }>
											{ __( 'Remove', 'jetpack' ) }
										</Button>
									) }
								</PanelRow>
							) }
						/>
					</MediaUploadCheck>
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
					<BaseControl
						id="jetpack-podcast-episode-people"
						label={ __( 'People', 'jetpack' ) }
						help={ __( 'Hosts, guests, and other people featured in this episode.', 'jetpack' ) }
						__nextHasNoMarginBottom
					>
						<PeopleEditor
							people={ people }
							onChange={ value => setAttributes( { people: value } ) }
						/>
					</BaseControl>
				</PanelBody>
			</InspectorControls>

			<article className="jetpack-podcast-episode">
				{ showPoster && imageUrl && (
					<figure className="jetpack-podcast-episode__poster">
						<img src={ imageUrl } alt={ title || '' } />
					</figure>
				) }
				<div className="jetpack-podcast-episode__body">
					{ ( seasonNumber || episodeNumber || episodeType !== 'full' || explicit ) && (
						<p className="jetpack-podcast-episode__meta-line">
							{ seasonNumber ? (
								<span className="jetpack-podcast-episode__season">
									{ /* translators: %d: season number */ }
									{ __( 'Season', 'jetpack' ) } { seasonNumber }
								</span>
							) : null }
							{ episodeNumber ? (
								<span className="jetpack-podcast-episode__episode-number">
									{ __( 'Episode', 'jetpack' ) } { episodeNumber }
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

					<RichText
						tagName="h3"
						className="jetpack-podcast-episode__title"
						value={ title }
						onChange={ value => setAttributes( { title: value } ) }
						placeholder={ __( 'Episode title…', 'jetpack' ) }
						allowedFormats={ [] }
					/>

					{ ( author || duration || publishDate || isSelected ) && (
						<p className="jetpack-podcast-episode__byline">
							{ author && <span className="jetpack-podcast-episode__author">{ author }</span> }
							{ publishDate && (
								<time className="jetpack-podcast-episode__date">
									{ dateI18n( dateSettings.formats.date, publishDate ) }
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
								poster={ showPoster ? imageUrl : undefined }
								data-mime={ mediaMimeType || undefined }
							/>
						) : (
							<audio src={ mediaUrl } controls preload="metadata" />
						) }
					</div>

					<RichText
						tagName="p"
						className="jetpack-podcast-episode__summary"
						value={ summary }
						onChange={ value => setAttributes( { summary: value } ) }
						placeholder={ __( 'Short episode summary (one or two sentences)…', 'jetpack' ) }
						allowedFormats={ [] }
					/>

					<RichText
						tagName="div"
						className="jetpack-podcast-episode__description"
						value={ description }
						onChange={ value => setAttributes( { description: value } ) }
						placeholder={ __( 'Episode show notes…', 'jetpack' ) }
					/>
				</div>
			</article>
		</div>
	);
}
