import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { Button, Modal, ProgressBar, TextControl } from '@wordpress/components';
import {
	useRef,
	useState,
	useCallback,
	useLayoutEffect,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, upload, media, check, copy } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { Card, Stack, Text } from '@wordpress/ui';
import CaptionManagerModal from '../../src/client/components/caption-manager-modal/lazy';
import { getVideoInfoQueryKeyPrefix } from '../../src/client/components/caption-manager-modal/use-video-tracks';
import AddToContentMenu from '../../src/dashboard/components/add-to-content-menu';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { TAB_PATHS } from '../../src/dashboard/components/dashboard-tabs';
import FreeTierNotice from '../../src/dashboard/components/overview/free-tier-notice';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import Editor from '../../src/dashboard/components/video-details/editor';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { markFirstPublish, useFirstRunState } from '../../src/dashboard/hooks/use-first-run-state';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { LIBRARY_QUERY_KEY } from '../../src/dashboard/hooks/use-library';
import { useUpdateChapters } from '../../src/dashboard/hooks/use-update-chapters';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import { useInvalidateVideo, useVideo } from '../../src/dashboard/hooks/use-video';
import { isWpcomConnected } from '../../src/dashboard/utils/connection';
import './style.scss';
import type { EditorUploadState } from '../../src/dashboard/components/video-details/editor';
import type { LibraryItem } from '../../src/dashboard/types/library';
import type { ReactNode } from 'react';

type Step = 'upload' | 'uploading' | 'edit' | 'details' | 'success';

// Tags this flow's uploads in the shared queue so a remounted flow instance
// can re-find them. See the batchQueueIds initializer.
const UPLOAD_CONTEXT = 'upload-onboarding';
type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed';

type UploadedMedia = {
	id: number;
	source_url?: string;
	// VideoPress GUID, when the site has already registered the attachment as a
	// VideoPress video. See `readVideoPressGuid` for why it is often absent.
	videopressGuid?: string;
};

// The subset of a /wp/v2/media response this route reads. `jetpack_videopress`
// is the REST field registered by WPCOM_REST_API_V2_Attachment_VideoPress_Data
// (see src/class-initializer.php); `jetpack_videopress_guid` is the Simple-only
// flat field. Both are absent on sites without a VideoPress-backed attachment.
type MediaApiResponse = {
	id?: unknown;
	source_url?: string;
	message?: string;
	jetpack_videopress?: { guid?: unknown } | null;
	jetpack_videopress_guid?: unknown;
};

type UploadItem = {
	id: string;
	file: File;
	progress: number;
	status: UploadStatus;
	media?: UploadedMedia;
	error?: string;
};

type MediaDetailsPatch = {
	mediaId: number;
	title: string;
	description?: string;
	shareUrl?: string;
	videopressGuid?: string;
};

type PublishedVideo = {
	mediaId: number;
	title: string;
	shareUrl?: string;
	// Present only when the attachment is already a VideoPress video. The
	// "Add to a post or page" action is hidden without it — see SuccessCard.
	videopressGuid?: string;
};

type SampleVideo = {
	id: number;
	sourceUrl: string;
};

type SampleMediaResponse = {
	id?: unknown;
	source_url?: unknown;
};

type CreatedPost = {
	id?: unknown;
};

type SampleCopyTarget = 'link' | 'embed';

const SAMPLE_MEDIA_TITLE = 'videopress-sample';

const restApiConfig = () => {
	const initialState =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;
	const wpApiSettings = (
		window as typeof window & { wpApiSettings?: { root?: string; nonce?: string } }
	 ).wpApiSettings;
	const root = initialState?.API?.WP_API_root ?? wpApiSettings?.root;
	const nonce = initialState?.API?.WP_API_nonce ?? wpApiSettings?.nonce;

	if ( ! root || ! nonce ) {
		throw new Error(
			__(
				'Video upload is unavailable because the REST API credentials are missing.',
				'jetpack-videopress-pkg'
			)
		);
	}

	return { root, nonce };
};

const restUrl = ( path: string ) => {
	const { root } = restApiConfig();
	const base = new URL( root.endsWith( '/' ) ? root : `${ root }/`, window.location.origin );
	return new URL( path.replace( /^\/+/, '' ), base ).toString();
};

/**
 * Pull the VideoPress GUID out of a /wp/v2/media response.
 *
 * A GUID only exists once the site has registered the attachment as a
 * VideoPress video, which needs a WordPress.com connection. This onboarding
 * route uploads through plain `wp/v2/media` (see `uploadToMediaLibrary`), so on
 * an unconnected/local site the field is empty and every caller must treat the
 * GUID as optional.
 *
 * @param response - A raw media item from the REST API.
 * @return The GUID, or undefined when the attachment is not a VideoPress video.
 */
const readVideoPressGuid = ( response: MediaApiResponse | undefined ): string | undefined => {
	const guid = response?.jetpack_videopress?.guid ?? response?.jetpack_videopress_guid;
	return typeof guid === 'string' && guid !== '' ? guid : undefined;
};

const errorMessage = ( error: unknown ) => {
	if ( error instanceof Error ) {
		return error.message;
	}
	if ( typeof error === 'string' ) {
		return error;
	}
	const message = ( error as { message?: unknown } | null )?.message;
	return typeof message === 'string' && message !== ''
		? message
		: __( 'Unexpected upload error.', 'jetpack-videopress-pkg' );
};

/*
 * PARKED — the "Try a sample" path.
 *
 * The tile that opened this was removed from the "Get your first video online"
 * card; the helpers below (and `SampleVideoModal` further down, plus the
 * `.vp-sample-modal` block in style.scss) are intentionally kept whole so the
 * feature can be restored by re-adding the tile and its `sampleVideo` /
 * `isSampleModalOpen` state to `UploadOnboarding`. Nothing renders them today,
 * hence the two unused-vars exemptions on the entry points.
 */

const sampleMediaSearchPath = () =>
	`/wp/v2/media?search=${ encodeURIComponent( SAMPLE_MEDIA_TITLE ) }&media_type=video&per_page=1`;

/**
 * Resolve the locally seeded sample video without creating or promoting media.
 *
 * @return The seeded sample attachment, or null when the site does not provide one.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Parked with the "Try a sample" tile; see the note above.
const resolveSampleVideo = async (): Promise< SampleVideo | null > => {
	const results = await apiFetch< SampleMediaResponse[] >( {
		path: sampleMediaSearchPath(),
		method: 'GET',
	} );
	const firstResult = results[ 0 ];

	if (
		typeof firstResult?.id !== 'number' ||
		typeof firstResult?.source_url !== 'string' ||
		firstResult.source_url.trim() === ''
	) {
		return null;
	}

	return {
		id: firstResult.id,
		sourceUrl: firstResult.source_url,
	};
};

const serializeBlockAttributes = ( attributes: Record< string, unknown > ) =>
	JSON.stringify( attributes )
		.replaceAll( '\\\\', '\\u005c' )
		.replaceAll( '--', '\\u002d\\u002d' )
		.replaceAll( '<', '\\u003c' )
		.replaceAll( '>', '\\u003e' )
		.replaceAll( '&', '\\u0026' )
		.replaceAll( '\\"', '\\u0022' );

const escapeHtmlAttribute = ( value: string ) =>
	value
		.replaceAll( '&', '&amp;' )
		.replaceAll( '"', '&quot;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' );

const sampleEmbedCode = ( sourceUrl: string ) =>
	`<iframe title="VideoPress sample video" src="${ escapeHtmlAttribute(
		sourceUrl
	) }" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

const sampleBlockMarkup = ( sample: SampleVideo ) =>
	`<!-- wp:videopress/video ${ serializeBlockAttributes( {
		id: sample.id,
		src: sample.sourceUrl,
		controls: true,
	} ) } /-->`;

/**
 * Upload a video as a regular WordPress attachment. The dashboard's shared
 * useUpload() path is a VideoPress/tus upload that depends on WordPress.com
 * upload JWTs and does not complete in offline/local Docker environments.
 * This onboarding route therefore uses wp/v2/media so the selected files
 * genuinely land in the WordPress Media Library. Those local attachments may
 * not appear in the VideoPress Library where the listing is constrained to
 * WordPress.com VideoPress rows.
 *
 * @param file       - File selected by the user.
 * @param onProgress - Called with the XHR upload progress percentage.
 * @return The created media attachment.
 */
const uploadToMediaLibrary = (
	file: File,
	onProgress: ( percent: number ) => void
): Promise< UploadedMedia > =>
	new Promise( ( resolve, reject ) => {
		let config: ReturnType< typeof restApiConfig >;
		try {
			config = restApiConfig();
		} catch ( error ) {
			reject( error );
			return;
		}

		const formData = new FormData();
		formData.append( 'file', file, file.name );

		const xhr = new XMLHttpRequest();
		xhr.open( 'POST', restUrl( '/wp/v2/media' ) );
		xhr.setRequestHeader( 'X-WP-Nonce', config.nonce );

		xhr.upload.onprogress = event => {
			if ( event.lengthComputable && event.total > 0 ) {
				onProgress( Math.min( 99, Math.round( ( event.loaded / event.total ) * 100 ) ) );
			}
		};

		xhr.onload = () => {
			let response: MediaApiResponse = {};
			try {
				response = JSON.parse( xhr.responseText || '{}' );
			} catch {
				// Leave response empty; the status-derived error below is clearer.
			}

			if ( xhr.status >= 200 && xhr.status < 300 && typeof response.id === 'number' ) {
				onProgress( 100 );
				resolve( {
					id: response.id,
					source_url: response.source_url,
					videopressGuid: readVideoPressGuid( response ),
				} );
				return;
			}

			reject(
				new Error(
					response.message ??
						sprintf(
							/* translators: %d: HTTP status code. */
							__( 'Upload failed with HTTP status %d.', 'jetpack-videopress-pkg' ),
							xhr.status
						)
				)
			);
		};

		xhr.onerror = () => {
			reject(
				new Error(
					__(
						'Upload failed. Please check your connection and try again.',
						'jetpack-videopress-pkg'
					)
				)
			);
		};

		xhr.send( formData );
	} );

/**
 * Step 1 — the dropzone. On drop/select it hands the files up so the flow can
 * morph to the uploading step.
 *
 * @param props                  - Component props.
 * @param props.openPicker       - Opens the file picker.
 * @param props.onFiles          - Called with the selected files.
 * @param props.isUploadDisabled - Whether the free-tier limit blocks uploading.
 * @param props.allowMultiple    - Whether the plan allows selecting several files.
 * @param props.isFirstRun       - Whether this is the user's first video.
 * @return The dropzone card.
 */
const UploadCard = ( {
	openPicker,
	onFiles,
	isUploadDisabled,
	allowMultiple,
	isFirstRun,
}: {
	openPicker: () => void;
	onFiles: ( files: File[] ) => void;
	isUploadDisabled: boolean;
	allowMultiple: boolean;
	isFirstRun: boolean;
} ) => {
	const [ dragging, setDragging ] = useState( false );
	const dropzoneClassName = `vp-onboarding__dropzone${ dragging ? ' is-dragging' : '' }${
		isUploadDisabled ? ' is-disabled' : ''
	}`;

	return (
		<Card.Root className="vp-onboarding__card vp-onboarding__card--upload">
			<Card.Header>
				<Card.Title>
					{ /* Someone arriving here with a library of 27 videos is not
					     uploading their first one. */ }
					{ isFirstRun
						? __( 'Upload your first video', 'jetpack-videopress-pkg' )
						: __( 'Upload a video', 'jetpack-videopress-pkg' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{ isUploadDisabled && (
					<div className="vp-onboarding__limit-notice">
						<FreeTierNotice hasUsedVideo />
					</div>
				) }
				<div
					className={ dropzoneClassName }
					aria-disabled={ isUploadDisabled }
					onDragOver={
						isUploadDisabled
							? undefined
							: e => {
									e.preventDefault();
									setDragging( true );
							  }
					}
					onDragLeave={ isUploadDisabled ? undefined : () => setDragging( false ) }
					onDrop={
						isUploadDisabled
							? undefined
							: e => {
									e.preventDefault();
									setDragging( false );
									onFiles( Array.from( e.dataTransfer.files ) );
							  }
					}
				>
					<svg className="vp-onboarding__dropzone-outline" aria-hidden="true" focusable="false">
						<rect className="vp-onboarding__dropzone-outline-rect" />
					</svg>
					<Icon icon={ upload } size={ 32 } className="vp-onboarding__dropzone-icon" />
					<Text variant="body-lg" className="vp-onboarding__dropzone-hint">
						{ allowMultiple
							? __( 'Drag and drop your videos here', 'jetpack-videopress-pkg' )
							: __( 'Drag and drop your video here', 'jetpack-videopress-pkg' ) }
					</Text>
					<Text variant="body-sm" className="vp-onboarding__dropzone-sub">
						{ allowMultiple
							? __(
									'Add one or several. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
									'jetpack-videopress-pkg'
							  )
							: __(
									'Add one video. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
									'jetpack-videopress-pkg'
							  ) }
					</Text>
					<Button
						variant="primary"
						__next40pxDefaultSize
						onClick={ openPicker }
						disabled={ isUploadDisabled }
					>
						{ allowMultiple
							? __( 'Select videos to upload', 'jetpack-videopress-pkg' )
							: __( 'Select a video to upload', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

/**
 * Interstitial — DS ProgressBar(s) while videos upload. One bar for a single
 * file; a per-file list for a bulk upload.
 *
 * @param props         - Component props.
 * @param props.uploads - The uploading files and their real upload state.
 * @param props.onBack  - Return to the upload step after an error.
 * @return The uploading card.
 */
const UploadingCard = ( { uploads, onBack }: { uploads: UploadItem[]; onBack: () => void } ) => {
	if ( uploads.length <= 1 ) {
		const item = uploads[ 0 ];
		const name = item?.file.name || __( 'your-video.mp4', 'jetpack-videopress-pkg' );
		const p = item?.progress ?? 0;
		const failed = item?.status === 'failed';
		return (
			<Card.Root className="vp-onboarding__card">
				<Card.Header>
					<Card.Title>
						{ failed
							? __( 'Upload failed', 'jetpack-videopress-pkg' )
							: __( 'Uploading your video', 'jetpack-videopress-pkg' ) }
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="lg">
						<div className="vp-details__file">
							<span className="vp-details__file-icon">
								<Icon icon={ media } size={ 20 } />
							</span>
							<span className="vp-details__file-name">{ name }</span>
							{ failed ? (
								<span className="vp-details__file-status is-error">
									{ __( 'Failed', 'jetpack-videopress-pkg' ) }
								</span>
							) : (
								<span className="vp-uploading__pct">{ Math.round( p ) }%</span>
							) }
						</div>
						<ProgressBar value={ p } className="vp-uploading__bar" />
						{ failed ? (
							<>
								<Text variant="body-sm" className="vp-uploading__error">
									{ item?.error ??
										__( 'The video could not be uploaded.', 'jetpack-videopress-pkg' ) }
								</Text>
								<div className="vp-uploading__actions">
									<Button variant="tertiary" onClick={ onBack }>
										{ __( 'Back', 'jetpack-videopress-pkg' ) }
									</Button>
								</div>
							</>
						) : (
							<Text variant="body-sm" className="vp-uploading__hint">
								{ __(
									'Hang tight — we’re processing your video. You can add its details next.',
									'jetpack-videopress-pkg'
								) }
							</Text>
						) }
					</Stack>
				</Card.Content>
			</Card.Root>
		);
	}

	const done = uploads.filter( item => item.status === 'success' ).length;
	const failed = uploads.filter( item => item.status === 'failed' ).length;
	return (
		<Card.Root className="vp-onboarding__card">
			<Card.Header>
				<Card.Title>
					{ sprintf(
						/* translators: %d: number of videos. */
						__( 'Uploading %d videos', 'jetpack-videopress-pkg' ),
						uploads.length
					) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ uploads.map( item => {
						const p = item.progress;
						const complete = item.status === 'success';
						const rowFailed = item.status === 'failed';
						// Flattened out of a nested ternary so the row's three
						// states (failed / done / in progress) read in order.
						let rowStatus = <span className="vp-uploading__pct">{ Math.round( p ) }%</span>;
						if ( rowFailed ) {
							rowStatus = (
								<span className="vp-details__file-status is-error">
									{ __( 'Failed', 'jetpack-videopress-pkg' ) }
								</span>
							);
						} else if ( complete ) {
							rowStatus = (
								<span className="vp-details__file-status">
									<Icon icon={ check } size={ 16 } />
								</span>
							);
						}
						return (
							<div className="vp-bulk__uprow" key={ item.id }>
								<span className="vp-details__file-icon">
									<Icon icon={ media } size={ 20 } />
								</span>
								<div className="vp-bulk__uprow-main">
									<div className="vp-bulk__uprow-top">
										<span className="vp-details__file-name">{ item.file.name }</span>
										{ rowStatus }
									</div>
									<ProgressBar value={ p } className="vp-uploading__bar" />
									{ rowFailed && item.error && (
										<Text variant="body-sm" className="vp-uploading__error">
											{ item.error }
										</Text>
									) }
								</div>
							</div>
						);
					} ) }
					{ failed > 0 ? (
						<>
							<Text variant="body-sm" className="vp-uploading__error">
								{ sprintf(
									/* translators: %d: number of failed uploads. */
									_n(
										'%d upload failed. Go back and try again.',
										'%d uploads failed. Go back and try again.',
										failed,
										'jetpack-videopress-pkg'
									),
									failed
								) }
							</Text>
							<div className="vp-uploading__actions">
								<Button variant="tertiary" onClick={ onBack }>
									{ __( 'Back', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						</>
					) : (
						<Text variant="body-sm" className="vp-uploading__hint">
							{ sprintf(
								/* translators: 1: uploaded count, 2: total count. */
								__( '%1$d of %2$d uploaded — add details next.', 'jetpack-videopress-pkg' ),
								done,
								uploads.length
							) }
						</Text>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

/**
 * Step 2 — the details form the flow morphs to after upload. A single video
 * gets file name + title + description; a bulk upload gets an inline list,
 * with independent file name and title fields per video.
 *
 * @param props           - Component props.
 * @param props.uploads   - The uploaded files and their media IDs.
 * @param props.onBack    - Return to the upload step.
 * @param props.onPublish - Persist details for each uploaded media item.
 * @return The details card.
 */
const DetailsCard = ( {
	uploads,
	onBack,
	onPublish,
}: {
	uploads: UploadItem[];
	onBack: () => void;
	onPublish: ( patches: MediaDetailsPatch[] ) => Promise< void >;
} ) => {
	const files = uploads.map( item => item.file );
	const [ titles, setTitles ] = useState< string[] >( () =>
		files.length ? files.map( () => '' ) : [ '' ]
	);
	const [ description, setDescription ] = useState( '' );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ publishError, setPublishError ] = useState< string | null >( null );
	const setTitle = ( i: number, value: string ) =>
		setTitles( prev => prev.map( ( t, j ) => ( j === i ? value : t ) ) );

	const publish = useCallback( async () => {
		setIsPublishing( true );
		setPublishError( null );
		try {
			await onPublish(
				uploads.map( ( item, i ) => {
					if ( ! item.media ) {
						throw new Error(
							__(
								'Upload details cannot be saved before the upload finishes.',
								'jetpack-videopress-pkg'
							)
						);
					}
					const title = titles[ i ]?.trim() || item.file.name;
					const patch: MediaDetailsPatch = {
						mediaId: item.media.id,
						title,
						shareUrl: item.media.source_url,
						videopressGuid: item.media.videopressGuid,
					};
					if ( uploads.length <= 1 ) {
						patch.description = description;
					}
					return patch;
				} )
			);
		} catch ( error ) {
			setPublishError( errorMessage( error ) );
		} finally {
			setIsPublishing( false );
		}
	}, [ description, onPublish, titles, uploads ] );

	const actions = ( publishLabel: string ) => (
		<div className="vp-details__actions">
			<Button variant="tertiary" onClick={ onBack } disabled={ isPublishing }>
				{ __( 'Back', 'jetpack-videopress-pkg' ) }
			</Button>
			<Button
				variant="primary"
				__next40pxDefaultSize
				onClick={ publish }
				disabled={ isPublishing }
				isBusy={ isPublishing }
			>
				{ publishLabel }
			</Button>
		</div>
	);

	if ( files.length <= 1 ) {
		const name = files[ 0 ]?.name || __( 'your-video.mp4', 'jetpack-videopress-pkg' );
		return (
			<Card.Root className="vp-onboarding__card">
				<Card.Header>
					<Card.Title>{ __( 'Add your video details', 'jetpack-videopress-pkg' ) }</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="lg">
						{ /*
						 * The filename is shown, not edited: the old File Name
						 * field never saved anywhere (the PATCH carries only
						 * title/description), so an input was a lie.
						 */ }
						<div className="vp-details__file">
							<span className="vp-details__file-icon">
								<Icon icon={ media } size={ 20 } />
							</span>
							<span className="vp-details__file-name">{ name }</span>
							<span className="vp-details__file-status">
								<Icon icon={ check } size={ 16 } />
								{ __( 'Uploaded', 'jetpack-videopress-pkg' ) }
							</span>
						</div>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Video Title', 'jetpack-videopress-pkg' ) }
							value={ titles[ 0 ] }
							onChange={ v => setTitle( 0, v ) }
							placeholder={ __( 'Give your video a title', 'jetpack-videopress-pkg' ) }
							help={ __(
								'This title will appear with your thumbnail (optional)',
								'jetpack-videopress-pkg'
							) }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Description', 'jetpack-videopress-pkg' ) }
							value={ description }
							onChange={ setDescription }
							placeholder={ __( 'What is this video about?', 'jetpack-videopress-pkg' ) }
						/>
						{ publishError && (
							<Text variant="body-sm" className="vp-details__error">
								{ publishError }
							</Text>
						) }
					</Stack>
				</Card.Content>
				{ actions( __( 'Publish video', 'jetpack-videopress-pkg' ) ) }
			</Card.Root>
		);
	}

	return (
		<Card.Root className="vp-onboarding__card">
			<Card.Header>
				<Card.Title>
					{ sprintf(
						/* translators: %d: number of videos. */
						__( 'Add details · %d videos', 'jetpack-videopress-pkg' ),
						files.length
					) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ files.map( ( file, i ) => (
						<div className="vp-bulk__row" key={ i }>
							<div className="vp-bulk__row-head">
								<span className="vp-details__file-icon">
									<Icon icon={ media } size={ 20 } />
								</span>
								<span className="vp-details__file-name">{ file.name }</span>
								<span className="vp-details__file-status">
									<Icon icon={ check } size={ 16 } />
									{ __( 'Uploaded', 'jetpack-videopress-pkg' ) }
								</span>
							</div>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Video Title', 'jetpack-videopress-pkg' ) }
								value={ titles[ i ] }
								onChange={ v => setTitle( i, v ) }
								placeholder={ __( 'Give your video a title', 'jetpack-videopress-pkg' ) }
								help={ __(
									'This title will appear with your thumbnail (optional)',
									'jetpack-videopress-pkg'
								) }
							/>
						</div>
					) ) }
					{ publishError && (
						<Text variant="body-sm" className="vp-details__error">
							{ publishError }
						</Text>
					) }
				</Stack>
			</Card.Content>
			{ actions(
				sprintf(
					/* translators: %d: number of videos. */
					__( 'Publish %d videos', 'jetpack-videopress-pkg' ),
					files.length
				)
			) }
		</Card.Root>
	);
};

/**
 * Step 3 — confirmation after the media details are saved. Shows the share
 * links returned by the local wp/v2/media upload path and leaves navigation to
 * the user.
 *
 * @param props            - Component props.
 * @param props.published  - Published videos and their share links.
 * @param props.onGoToHome - Navigate to the Home tab.
 * @return The success card.
 */
const SuccessCard = ( {
	published,
	onGoToHome,
}: {
	published: PublishedVideo[];
	onGoToHome: () => void;
} ) => {
	const [ copiedMediaId, setCopiedMediaId ] = useState< number | null >( null );
	const [ copyError, setCopyError ] = useState< string | null >( null );

	const copyShareLink = useCallback( ( video: PublishedVideo ) => {
		setCopyError( null );
		if ( ! video.shareUrl ) {
			setCopyError( __( 'The share link could not be copied.', 'jetpack-videopress-pkg' ) );
			return;
		}

		void copyTextToClipboard( video.shareUrl )
			.then( () => setCopiedMediaId( video.mediaId ) )
			.catch( () => {
				setCopyError( __( 'The share link could not be copied.', 'jetpack-videopress-pkg' ) );
			} );
	}, [] );

	const renderShareField = ( video: PublishedVideo, index?: number ) => (
		<div className="vp-success__share" key={ video.mediaId }>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				className="vp-success__share-field"
				label={
					index == null
						? __( 'Share link', 'jetpack-videopress-pkg' )
						: sprintf(
								/* translators: %d: number of the video in the published list. */
								__( 'Share link for video %d', 'jetpack-videopress-pkg' ),
								index + 1
						  )
				}
				value={ video.shareUrl ?? '' }
				onChange={ () => undefined }
				readOnly
			/>
			<Button
				variant="secondary"
				__next40pxDefaultSize
				icon={ copy }
				onClick={ () => copyShareLink( video ) }
				disabled={ ! video.shareUrl }
			>
				{ copiedMediaId === video.mediaId
					? __( 'Copied', 'jetpack-videopress-pkg' )
					: __( 'Copy link', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);

	if ( published.length <= 1 ) {
		const video = published[ 0 ];
		const title = video?.title || __( 'Your video', 'jetpack-videopress-pkg' );

		return (
			<Card.Root className="vp-onboarding__card">
				<Card.Header>
					<Card.Title>{ __( 'Your video is published', 'jetpack-videopress-pkg' ) }</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="lg">
						<Text variant="body-md" className="vp-success__summary">
							{ __( 'Your video is live and ready to share.', 'jetpack-videopress-pkg' ) }
						</Text>
						<Text variant="body-lg" className="vp-success__title">
							{ title }
						</Text>
						{ video && renderShareField( video ) }
						{ copyError && (
							<Text variant="body-sm" className="vp-success__copy-status is-error">
								{ copyError }
							</Text>
						) }
					</Stack>
				</Card.Content>
				<div className="vp-success__actions">
					{ /* Single video: the hand-off sits beside "Go to Home" in the footer. */ }
					<AddToContentMenu guid={ video?.videopressGuid } />
					<Button variant="primary" __next40pxDefaultSize onClick={ onGoToHome }>
						{ __( 'Go to Home', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
			</Card.Root>
		);
	}

	return (
		<Card.Root className="vp-onboarding__card">
			<Card.Header>
				<Card.Title>
					{ sprintf(
						/* translators: %d: number of videos. */
						__( '%d videos published', 'jetpack-videopress-pkg' ),
						published.length
					) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Text variant="body-md" className="vp-success__summary">
						{ __( 'Your videos are live and ready to share.', 'jetpack-videopress-pkg' ) }
					</Text>
					<div className="vp-success__list">
						{ published.map( ( video, index ) => (
							<div className="vp-success__item" key={ video.mediaId }>
								<Text variant="body-md" className="vp-success__title">
									{ video.title }
								</Text>
								{ renderShareField( video, index ) }
								{ /*
								 * Bulk upload: the hand-off is per video rather than in the
								 * card footer, because a footer action would have to guess
								 * which of several videos the user meant. Each row owns its
								 * own menu, and rows without a GUID simply render none.
								 */ }
								{ video.videopressGuid && (
									<div className="vp-success__item-actions">
										<AddToContentMenu
											guid={ video.videopressGuid }
											label={ sprintf(
												/* translators: %s: video title. */
												__( 'Add “%s” to a post or page', 'jetpack-videopress-pkg' ),
												video.title
											) }
										/>
									</div>
								) }
							</div>
						) ) }
					</div>
					{ copyError && (
						<Text variant="body-sm" className="vp-success__copy-status is-error">
							{ copyError }
						</Text>
					) }
				</Stack>
			</Card.Content>
			<div className="vp-success__actions">
				<Button variant="primary" __next40pxDefaultSize onClick={ onGoToHome }>
					{ __( 'Go to Home', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</Card.Root>
	);
};

/**
 * Preview-only sample modal. This intentionally does not upload or promote the
 * sample attachment, so it cannot consume free-tier storage.
 *
 * PARKED: nothing renders this since the "Try a sample" tile was removed. Kept
 * intact so the tile can be restored without rebuilding the modal.
 *
 * @param props            - Component props.
 * @param props.sample     - The resolved seeded sample attachment.
 * @param props.onClose    - Close the modal.
 * @param props.openPicker - Opens the file picker after closing the modal.
 * @return The sample video modal.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Parked with the "Try a sample" tile; see the note near `resolveSampleVideo`.
const SampleVideoModal = ( {
	sample,
	onClose,
	openPicker,
}: {
	sample: SampleVideo;
	onClose: () => void;
	openPicker: () => void;
} ) => {
	const [ copiedTarget, setCopiedTarget ] = useState< SampleCopyTarget | null >( null );
	const [ copyError, setCopyError ] = useState< string | null >( null );
	const [ isCreatingPost, setIsCreatingPost ] = useState( false );
	const [ postError, setPostError ] = useState< string | null >( null );
	const embedCode = sampleEmbedCode( sample.sourceUrl );

	const copyText = useCallback( ( target: SampleCopyTarget, text: string ) => {
		setCopyError( null );
		void copyTextToClipboard( text )
			.then( () => setCopiedTarget( target ) )
			.catch( () => {
				setCopyError( __( 'The share details could not be copied.', 'jetpack-videopress-pkg' ) );
			} );
	}, [] );

	const addToPost = useCallback( async () => {
		setIsCreatingPost( true );
		setPostError( null );

		try {
			/*
			 * This local onboarding sample is a raw media attachment. On a real
			 * wpcom-connected VideoPress site, this should point at a known
			 * VideoPress sample GUID and use the VideoPress player/embed instead.
			 */
			const post = await apiFetch< CreatedPost >( {
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					status: 'draft',
					title: __( 'My first video', 'jetpack-videopress-pkg' ),
					content: sampleBlockMarkup( sample ),
				},
			} );

			if ( typeof post.id !== 'number' ) {
				throw new Error( __( 'The draft post could not be created.', 'jetpack-videopress-pkg' ) );
			}

			window.location.href = `/wp-admin/post.php?post=${ post.id }&action=edit`;
		} catch ( error ) {
			setPostError( errorMessage( error ) );
			setIsCreatingPost( false );
		}
	}, [ sample ] );

	const uploadOwnInstead = useCallback( () => {
		onClose();
		openPicker();
	}, [ onClose, openPicker ] );

	return (
		<Modal
			title={ __( 'Try a sample video', 'jetpack-videopress-pkg' ) }
			onRequestClose={ onClose }
			className="vp-sample-modal"
		>
			<div className="vp-sample-modal__body">
				<video
					className="vp-sample-modal__player"
					controls
					src={ sample.sourceUrl }
					aria-label={ __( 'Sample video', 'jetpack-videopress-pkg' ) }
				/>

				<div className="vp-success__share">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="vp-success__share-field"
						label={ __( 'Share link', 'jetpack-videopress-pkg' ) }
						value={ sample.sourceUrl }
						onChange={ () => undefined }
						readOnly
					/>
					<Button
						variant="secondary"
						__next40pxDefaultSize
						icon={ copy }
						onClick={ () => copyText( 'link', sample.sourceUrl ) }
					>
						{ copiedTarget === 'link'
							? __( 'Copied', 'jetpack-videopress-pkg' )
							: __( 'Copy link', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>

				<div className="vp-success__share">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="vp-success__share-field"
						label={ __( 'Embed code', 'jetpack-videopress-pkg' ) }
						value={ embedCode }
						onChange={ () => undefined }
						readOnly
					/>
					<Button
						variant="secondary"
						__next40pxDefaultSize
						icon={ copy }
						onClick={ () => copyText( 'embed', embedCode ) }
					>
						{ copiedTarget === 'embed'
							? __( 'Copied', 'jetpack-videopress-pkg' )
							: __( 'Copy embed', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>

				{ copyError && (
					<Text variant="body-sm" className="vp-success__copy-status is-error">
						{ copyError }
					</Text>
				) }
				{ postError && (
					<Text variant="body-sm" className="vp-details__error">
						{ postError }
					</Text>
				) }
			</div>

			<div className="vp-sample-modal__actions">
				<Button variant="secondary" onClick={ uploadOwnInstead } disabled={ isCreatingPost }>
					{ __( 'Upload my own instead', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button
					variant="primary"
					__next40pxDefaultSize
					onClick={ addToPost }
					disabled={ isCreatingPost }
					isBusy={ isCreatingPost }
				>
					{ __( 'Add this to a post', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</Modal>
	);
};

/**
 * Height-morphing, cross-fading wrapper for the multi-step card flow. The
 * active card animates in from below while the previous slides up and fades
 * out, and the container height eases between the two — the Cloudflare
 * onboarding step transition.
 *
 * @param props            - Component props.
 * @param props.step       - The active step.
 * @param props.prev       - The exiting step (null when settled).
 * @param props.onExitDone - Called once the exit animation completes.
 * @param props.render     - Renders the card for a given step.
 * @return The morphing flow element.
 */
/**
 * Copy text to the clipboard, working on plain-HTTP dev environments where
 * `navigator.clipboard` is undefined (it is secure-context-only). Falls back
 * to the hidden-textarea `execCommand` path the clipboard libraries use.
 *
 * @param text - Text to place on the clipboard.
 * @return Resolves when the text has been copied; rejects when neither path works.
 */
const copyTextToClipboard = ( text: string ): Promise< void > => {
	if ( navigator.clipboard ) {
		return navigator.clipboard.writeText( text );
	}

	return new Promise( ( resolve, reject ) => {
		const textarea = document.createElement( 'textarea' );
		textarea.value = text;
		textarea.setAttribute( 'readonly', '' );
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild( textarea );
		textarea.select();
		try {
			// execCommand is deprecated but is exactly the insecure-context
			// fallback the clipboard libraries use; there is no alternative.
			const ok = document.execCommand( 'copy' );
			if ( ok ) {
				resolve();
			} else {
				reject( new Error( 'copy rejected' ) );
			}
		} catch ( error ) {
			reject( error );
		} finally {
			textarea.remove();
		}
	} );
};

/**
 * Step 'edit' — the single-upload instant transition. One dropped file lands
 * here immediately: the edit surface (the same Editor the /video/:id route
 * renders, embedded under the dashboard tabs) with the player slot serving as
 * the upload's stage. Title and description are editable from the first
 * frame; Save waits for the attachment to exist. The URL stays /upload for
 * the whole draft session — the surface binds to the real record in place
 * rather than navigating mid-edit.
 *
 * @param props         - Component props.
 * @param props.upload  - The queue item driving the stage, mapped to the
 *                      flow's local shape. Undefined once acknowledged.
 * @param props.onRetry - Re-dispatches the upload after a failure.
 * @return The edit-step element.
 */
const EditStep = ( {
	upload: uploadItem,
	onRetry,
}: {
	upload: UploadItem | undefined;
	onRetry: () => void;
} ) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const invalidateVideo = useInvalidateVideo();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const { mutate: updateMeta, isPending: isSaving } = useUpdateVideoMeta();
	const { syncChapters } = useUpdateChapters();
	const { mutateAsync: deleteVideo, isPending: isDeleting } = useDeleteVideo();
	const [ chaptersOpen, setChaptersOpen ] = useState( false );
	const [ captionsOpen, setCaptionsOpen ] = useState( false );
	const [ fileMeta ] = useState( () =>
		uploadItem ? { name: uploadItem.file.name, size: uploadItem.file.size } : null
	);
	// One-shot per session: the celebration is a first-publish moment, not a
	// state of the video, so it must not re-fire on later refetches.
	const [ celebration, setCelebration ] = useState< 'pending' | 'showing' | 'done' >( 'pending' );

	// DERIVED, not copied into state: the first upload on a first-run site
	// flips the tab order and remounts this whole subtree mid-session (live
	// testing found the corpse twice). The queue row survives that, so it —
	// not component state — carries the attachment id for the session's whole
	// life; the row is acknowledged on the flow's exit paths, never here.
	const mediaId = uploadItem?.media ? Number( uploadItem.media.id ) : null;

	// With the GUID-less polling in useVideo, this follows the record through
	// the registration/transcode tail until it turns playable.
	const { video } = useVideo( mediaId ?? '' );
	const isPlayable = Boolean( video && video.type === 'videopress' && ! video.isProcessing );

	useEffect( () => {
		if ( isPlayable && celebration === 'pending' ) {
			// The video is genuinely live: first run is over for good, even if
			// the library count reads stale. Written when the celebration first
			// shows, which is this flow's publish moment — there is no separate
			// publish button.
			markFirstPublish();
			setCelebration( 'showing' );
		}
	}, [ isPlayable, celebration ] );

	// The record the surface renders until the real one arrives — the same
	// synthetic shape the Library splices in for in-flight uploads. The id is
	// the queue id; useVideoDetailsForm's preserve-on-rebind keeps typed edits
	// when it swaps to the attachment id.
	const draftVideo = useMemo< LibraryItem >(
		() => ( {
			id: `draft-${ fileMeta?.name ?? 'upload' }`,
			guid: '',
			type: 'local',
			title: ( fileMeta?.name ?? '' ).replace( /\.[^.]+$/, '' ),
			filename: fileMeta?.name ?? '',
			thumbnailUrl: null,
			durationSeconds: 0,
			uploadDate: new Date().toISOString(),
			privacy: 'site-default',
			isPrivate: false,
			fileSizeBytes: fileMeta?.size ?? 0,
			upload: { status: 'uploading', progress: 0 },
			description: '',
			rating: 'G',
			displayEmbed: false,
			allowDownloads: false,
			shortcode: '',
			isProcessing: false,
			orientation: null,
			tracks: [],
		} ),
		[ fileMeta ]
	);

	const boundVideo = video ?? draftVideo;

	// The player slot's stage. Cleared only once the video is playable, so the
	// GUID-dependent cards hold their skeletons through the processing tail
	// instead of popping in one refetch at a time.
	let uploadState: EditorUploadState | undefined;
	if ( ! isPlayable ) {
		const fileName = fileMeta?.name ?? '';
		if ( mediaId != null ) {
			uploadState = { status: 'processing', progress: 100, fileName };
		} else if ( uploadItem?.status === 'failed' ) {
			uploadState = {
				status: 'failed',
				progress: uploadItem.progress,
				fileName,
				error: uploadItem.error,
				onRetry,
			};
		} else {
			uploadState = { status: 'uploading', progress: uploadItem?.progress ?? 0, fileName };
		}
	}

	// Same query-client split as the /video/:id route: the caption manager
	// runs on its own client, so refresh the video info on close.
	const closeCaptions = useCallback( () => {
		setCaptionsOpen( false );
		void queryClient.invalidateQueries( {
			queryKey: getVideoInfoQueryKeyPrefix( video?.guid ?? '' ),
		} );
	}, [ queryClient, video?.guid ] );

	return (
		<>
			<Editor
				video={ boundVideo }
				isSaving={ isSaving || isDeleting }
				onSave={ ( values, reset ) => {
					// Guarded by uploadSession.saveDisabled below, but a stale
					// click mustn't PATCH a draft id either way.
					if ( ! video ) {
						return;
					}
					updateMeta(
						{ id: video.id, patch: values },
						{
							onSuccess: () => {
								// Same contract as the /video/:id save: a changed
								// description regenerates the chapters VTT, only
								// after the meta save succeeds.
								if ( values.description !== video.description ) {
									void syncChapters( video, values.description );
								}
								createSuccessNotice( __( 'Video details saved.', 'jetpack-videopress-pkg' ) );
								reset( values );
							},
							onError: () => {
								createErrorNotice(
									__( 'Failed to save video details.', 'jetpack-videopress-pkg' )
								);
							},
						}
					);
				} }
				onDelete={ () => {
					// Only reachable once the attachment exists — the ⋯ menu is
					// hidden while uploadState is present.
					if ( ! video || isDeleting ) {
						return;
					}
					deleteVideo( Number( video.id ) )
						.then( () => {
							createSuccessNotice( __( 'Video deleted.', 'jetpack-videopress-pkg' ) );
							navigate( { href: '/' } );
						} )
						.catch( () => {
							createErrorNotice( __( 'Failed to delete video.', 'jetpack-videopress-pkg' ) );
						} );
				} }
				onDownload={ () => {
					if ( video?.sourceUrl ) {
						window.open( video.sourceUrl, '_blank' );
					}
				} }
				onManageCaptions={ () => {
					// The tracks API is keyed by GUID; before it exists there is
					// nothing to manage (the menu holding this is hidden then too).
					if ( video?.guid ) {
						setCaptionsOpen( true );
					}
				} }
				chaptersOpen={ chaptersOpen }
				setChaptersOpen={ setChaptersOpen }
				uploadSession={ {
					uploadState,
					celebration:
						celebration === 'showing' ? { onDismiss: () => setCelebration( 'done' ) } : undefined,
					// The meta PATCH is keyed by attachment id, so Save waits for
					// the real record even while the form is already dirty.
					saveDisabled: ! video,
				} }
			/>
			{ captionsOpen && video && (
				<CaptionManagerModal
					isOpen={ captionsOpen }
					guid={ video.guid }
					title={ video.title }
					poster={ video.thumbnailUrl }
					isPrivate={ video.isPrivate }
					tracks={ video.tracks }
					onClose={ closeCaptions }
					onTracksChange={ () => void invalidateVideo( video.id ) }
				/>
			) }
		</>
	);
};

const StepFlow = ( {
	step,
	prev,
	onExitDone,
	render,
}: {
	step: Step;
	prev: Step | null;
	onExitDone: () => void;
	render: ( s: Step ) => ReactNode;
} ) => {
	const wrapRef = useRef< HTMLDivElement >( null );
	const [ height, setHeight ] = useState< number | undefined >( undefined );

	useLayoutEffect( () => {
		const active = wrapRef.current?.querySelector< HTMLElement >( '[data-active="true"]' );
		if ( active ) {
			setHeight( active.offsetHeight );
		}
		if ( prev != null ) {
			const t = setTimeout( onExitDone, 400 );
			return () => clearTimeout( t );
		}
	}, [ step, prev, onExitDone ] );

	// The wrapper's height is frozen inline, so content that grows WITHIN a
	// step (an error banner appearing, per-row messages) would overflow the
	// frame. Track the active card's size for the step's whole life, not just
	// its entrance.
	useLayoutEffect( () => {
		const active = wrapRef.current?.querySelector< HTMLElement >( '[data-active="true"]' );
		if ( ! active || typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const observer = new ResizeObserver( () => setHeight( active.offsetHeight ) );
		observer.observe( active );
		return () => observer.disconnect();
	}, [ step ] );

	return (
		<div
			className="vp-flow"
			ref={ wrapRef }
			style={ height != null ? { height: `${ height }px` } : undefined }
		>
			{ prev != null && prev !== step && (
				<div className="vp-flow__card is-exit" data-step={ prev } key={ `exit-${ prev }` }>
					{ render( prev ) }
				</div>
			) }
			<div
				className={ `vp-flow__card${ prev != null ? ' is-enter' : '' }` }
				data-step={ step }
				data-active="true"
				key={ step }
			>
				{ render( step ) }
			</div>
		</div>
	);
};

/**
 * VideoPress first-run onboarding (the Upload tab for a brand-new account).
 * One job: activation — get the user to their first uploaded video. Content is
 * grounded in the growth-brain teardown (see ~/dev/active/videopress-revamp).
 *
 * The upload → uploading → details → success hand-off uses a disappearing-card step morph
 * modelled on the Cloudflare email-routing onboarding, and supports bulk
 * uploads (per-file progress, then an inline list of detail fields).
 *
 * The step state lives in `StageInner` rather than here: the parent's
 * "already has videos" redirect has to know whether the flow is in progress,
 * and the flow must not lose its place if that check ever re-runs.
 *
 * @param props             - Component props.
 * @param props.isFree      - Whether the site is on the free tier.
 * @param props.isUnlimited - Whether the plan has unlimited video storage.
 * @param props.isAtLimit   - Whether the free-tier video limit is already used.
 * @param props.step        - The active step.
 * @param props.prev        - The exiting step (null when settled).
 * @param props.go          - Move to `next`, animating out of `prior`.
 * @param props.onExitDone  - Called when the exiting card has finished animating.
 * @return The onboarding tab element.
 */
const UploadOnboarding = ( {
	isFree,
	isUnlimited,
	isAtLimit,
	step,
	prev,
	go,
	onExitDone,
}: {
	isFree: boolean;
	isUnlimited: boolean;
	isAtLimit: boolean;
	step: Step;
	prev: Step | null;
	go: ( next: Step, prior: Step ) => void;
	onExitDone: () => void;
} ) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { createInfoNotice } = useGlobalNotices();
	const inputRef = useRef< HTMLInputElement >( null );
	const batchRef = useRef( 0 );
	const [ uploads, setUploads ] = useState< UploadItem[] >( [] );
	const [ publishedVideos, setPublishedVideos ] = useState< PublishedVideo[] >( [] );
	// On connected sites uploads run through the shared tus queue — the real
	// VideoPress pipeline, visible to every route and to useFreeTier. The
	// plain wp/v2/media XHR below survives only as the disconnected-site
	// fallback (tus needs a WordPress.com upload JWT).
	const { uploadQueue, startUpload, retryUpload, acknowledgeUpload } = useUpload();
	// Adopt any of this flow's own items already in the queue: uploading the
	// first video flips the first-run state (the library count goes 1), the
	// tab order changes, and this component remounts mid-upload — the queue
	// survives that, so the batch pointer must be recoverable from it.
	const [ batchQueueIds, setBatchQueueIds ] = useState< string[] >( () =>
		uploadQueue.filter( item => item.context === UPLOAD_CONTEXT ).map( item => item.id )
	);
	const isConnected = isWpcomConnected();
	const allowMultiple = ! isFree || isUnlimited;
	const firstRunState = useFirstRunState();

	const openPicker = useCallback( () => {
		if ( isAtLimit ) {
			return;
		}
		inputRef.current?.click();
	}, [ isAtLimit ] );
	const resetUploadStep = useCallback(
		( prior: Step ) => {
			batchRef.current += 1;
			setUploads( [] );
			// Settled queue rows from an abandoned batch are acknowledged away;
			// in-flight ones keep uploading (the Library shows them) — Back is
			// not Cancel.
			batchQueueIds.forEach( acknowledgeUpload );
			setBatchQueueIds( [] );
			setPublishedVideos( [] );
			go( 'upload', prior );
		},
		[ acknowledgeUpload, batchQueueIds, go ]
	);
	const updateUpload = useCallback( ( batch: number, id: string, patch: Partial< UploadItem > ) => {
		if ( batch !== batchRef.current ) {
			return;
		}
		setUploads( current =>
			current.map( item => ( item.id === id ? { ...item, ...patch } : item ) )
		);
	}, [] );

	const onFiles = useCallback(
		( selected: File[] ) => {
			if ( isAtLimit ) {
				return;
			}
			const selectedForPlan = allowMultiple ? selected : selected.slice( 0, 1 );
			if ( ! selectedForPlan.length ) {
				return;
			}
			// The plan slice above silently drops everything past the free
			// tier's one video; the dropped count must be surfaced or the
			// missing uploads read as a bug.
			if ( selected.length > selectedForPlan.length ) {
				const discarded = selected.length - selectedForPlan.length;
				createInfoNotice(
					sprintf(
						/* translators: %d: number of selected videos not uploaded on the free plan. */
						_n(
							'The free plan includes one video — uploading your first. Upgrade to add %d more.',
							'The free plan includes one video — uploading your first. Upgrade to add the other %d.',
							discarded,
							'jetpack-videopress-pkg'
						),
						discarded
					)
				);
			}
			const batch = batchRef.current + 1;
			batchRef.current = batch;
			setPublishedVideos( [] );

			if ( isConnected ) {
				// Multi-file batches land on the Library: every file starts in
				// the shared queue (same context tag as the single flow) and
				// the Library splices the in-flight rows in at the top, with
				// the upload pill carrying the batch from there. No
				// 'uploading' step — that interstitial survives only for the
				// disconnected XHR fallback below.
				if ( selectedForPlan.length > 1 ) {
					selectedForPlan.forEach( file => startUpload( file, UPLOAD_CONTEXT ) );
					navigate( { href: '/' } );
					return;
				}
				setUploads( [] );
				setBatchQueueIds( selectedForPlan.map( file => startUpload( file, UPLOAD_CONTEXT ) ) );
				// One file: skip the interstitial and cross-fade straight to the
				// edit surface — the upload carries on in its player slot, and
				// the user can write while it runs.
				go( 'edit', 'upload' );
				return;
			}

			const nextUploads = selectedForPlan.map( ( file, i ) => ( {
				id: `media-${ batch }-${ i }-${ file.name }`,
				file,
				progress: 0,
				status: 'pending' as UploadStatus,
			} ) );
			setUploads( nextUploads );
			go( 'uploading', 'upload' );

			nextUploads.forEach( item => {
				updateUpload( batch, item.id, { status: 'uploading' } );
				void uploadToMediaLibrary( item.file, percent =>
					updateUpload( batch, item.id, { progress: percent, status: 'uploading' } )
				)
					.then( mediaItem => {
						updateUpload( batch, item.id, {
							progress: 100,
							status: 'success',
							media: mediaItem,
							error: undefined,
						} );
						void queryClient.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
					} )
					.catch( error => {
						updateUpload( batch, item.id, {
							status: 'failed',
							error: errorMessage( error ),
						} );
					} );
			} );
		},
		[
			allowMultiple,
			createInfoNotice,
			go,
			isAtLimit,
			isConnected,
			navigate,
			queryClient,
			startUpload,
			updateUpload,
		]
	);

	// The queue is the source of truth while a connected-site batch uploads;
	// map its items into the flow's local shape so every step renders the same
	// structure regardless of pipeline.
	const queueUploads: UploadItem[] = batchQueueIds
		.map( id => uploadQueue.find( item => item.id === id ) )
		.filter( ( item ): item is NonNullable< typeof item > => Boolean( item ) )
		.map( item => ( {
			id: item.id,
			file: item.file,
			progress: Math.round( item.progress * 100 ),
			status: item.status,
			error: item.error,
			media: item.media
				? {
						id: Number( item.media.id ),
						source_url: item.media.src,
						videopressGuid: String( item.media.guid ),
				  }
				: undefined,
		} ) );
	const activeUploads = isConnected && batchQueueIds.length > 0 ? queueUploads : uploads;

	// The edit step's hooks into the shared queue. Stable identities so the
	// step's bind effect doesn't re-run on unrelated renders.
	const retryEditUpload = useCallback( () => {
		const id = batchQueueIds[ 0 ];
		if ( id ) {
			retryUpload( id );
		}
	}, [ batchQueueIds, retryUpload ] );
	// Advance to details once every file has finished. For queue batches the
	// settled items are snapshotted into local state and acknowledged out of
	// the shared queue — from here the flow owns them, and nothing else (the
	// Library splice, the future upload pill) should keep reporting them.
	useEffect( () => {
		if (
			step === 'uploading' &&
			activeUploads.length > 0 &&
			activeUploads.every( item => item.status === 'success' )
		) {
			const t = setTimeout( () => {
				if ( isConnected && batchQueueIds.length > 0 ) {
					setUploads( activeUploads );
					batchQueueIds.forEach( acknowledgeUpload );
					setBatchQueueIds( [] );
				}
				go( 'details', 'uploading' );
			}, 450 );
			return () => clearTimeout( t );
		}
	}, [ step, activeUploads, batchQueueIds, isConnected, acknowledgeUpload, go ] );

	const publishDetails = useCallback(
		async ( patches: MediaDetailsPatch[] ) => {
			const responses = await Promise.all(
				patches.map( patch => {
					const data: { title: string; description?: string } = { title: patch.title };
					if ( patch.description !== undefined ) {
						data.description = patch.description;
					}
					return apiFetch< MediaApiResponse >( {
						path: `/wp/v2/media/${ patch.mediaId }`,
						method: 'PATCH',
						data,
					} );
				} )
			);
			// The user has now published: first run is over for good, even if the
			// library is later emptied or the count reads stale. Written before the
			// refetch below so no query result can land while the flag is still cold.
			markFirstPublish();
			await queryClient.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			setPublishedVideos(
				patches.map( ( patch, i ) => ( {
					mediaId: patch.mediaId,
					title: patch.title,
					// Local uploads go through wp/v2/media, so this is the WP attachment URL,
					// not a real VideoPress share/embed URL; on a wpcom-connected site it should
					// use the VideoPress URL/embed instead.
					shareUrl: patch.shareUrl,
					// Prefer the GUID from this PATCH response: it is the freshest read of
					// the attachment, and a connected site may only have registered the
					// VideoPress video after the original upload response was sent.
					videopressGuid: readVideoPressGuid( responses[ i ] ) ?? patch.videopressGuid,
				} ) )
			);
			go( 'success', 'details' );
		},
		[ go, queryClient ]
	);

	// Publishing the first video ends the first-run experience, so the hand-off
	// goes to Home — the surface that answers "what happened since I was last
	// here, and what do I want to do now" — rather than dropping the user into
	// a bare file list.
	const goToHome = useCallback( () => {
		navigate( { href: TAB_PATHS.home } );
	}, [ navigate ] );

	const renderStep = ( s: Step ) => {
		if ( s === 'upload' ) {
			return (
				<UploadCard
					openPicker={ openPicker }
					onFiles={ onFiles }
					isUploadDisabled={ isAtLimit }
					allowMultiple={ allowMultiple }
					isFirstRun={ firstRunState === 'first-run' }
				/>
			);
		}
		if ( s === 'uploading' ) {
			return (
				<UploadingCard uploads={ activeUploads } onBack={ () => resetUploadStep( 'uploading' ) } />
			);
		}
		if ( s === 'edit' ) {
			return <EditStep upload={ queueUploads[ 0 ] } onRetry={ retryEditUpload } />;
		}
		if ( s === 'success' ) {
			return <SuccessCard published={ publishedVideos } onGoToHome={ goToHome } />;
		}
		return (
			<DetailsCard
				uploads={ uploads }
				onBack={ () => resetUploadStep( 'details' ) }
				onPublish={ publishDetails }
			/>
		);
	};

	return (
		<div className="vp-onboarding">
			{ /*
			 * The tile card that used to sit above the dropzone is gone by
			 * request: the dropzone below says everything the tiles said, and
			 * the welcome modal already made the pitch. One card, one action.
			 */ }

			{ /* Card 2 — the morphing upload → uploading → details → success step flow. */ }
			<StepFlow step={ step } prev={ prev } onExitDone={ onExitDone } render={ renderStep } />

			<input
				ref={ inputRef }
				type="file"
				accept="video/*"
				multiple={ ! isFree || isUnlimited }
				className="vp-onboarding__input"
				onChange={ e => {
					onFiles( Array.from( e.target.files ?? [] ) );
					e.currentTarget.value = '';
				} }
			/>
		</div>
	);
};

const StageInner = () => {
	const { isAtLimit, isFree, isUnlimited, videoCount } = useFreeTier();
	const navigate = useNavigate();
	const [ step, setStep ] = useState< Step >( 'upload' );
	const [ prev, setPrev ] = useState< Step | null >( null );
	const [ hasEnteredFlow, setHasEnteredFlow ] = useState( false );

	const go = useCallback( ( next: Step, prior: Step ) => {
		setPrev( prior );
		setStep( next );
		// Moving off the dropzone means this visit owns a flow. `go` is the only
		// transition point (`resetUploadStep` routes through it too), so this is
		// the one place that needs to know.
		if ( next !== 'upload' ) {
			setHasEnteredFlow( true );
		}
	}, [] );
	const onExitDone = useCallback( () => setPrev( null ), [] );

	// This route is the first-run experience, so somebody who *arrives* already
	// holding videos belongs in the Library instead.
	//
	// Two things stop that check firing on someone mid-flow. Every successful
	// upload invalidates the library query (see `onFiles`), so on a connected
	// paid site the count flips to 1 *during* the flow, before the details step
	// — `step` covers that. And `hasEnteredFlow` covers the way back: pressing
	// Back from details returns `step` to 'upload' with the count now at 1,
	// which would otherwise eject the user and discard the details they were
	// part-way through filling in.
	const shouldRedirectToLibrary =
		step === 'upload' && ! hasEnteredFlow && videoCount > 0 && ! isAtLimit;

	useEffect( () => {
		if ( shouldRedirectToLibrary ) {
			navigate( { href: '/' } );
		}
	}, [ navigate, shouldRedirectToLibrary ] );

	// Rendered as a conditional rather than an early `return null` above: the
	// hooks this component holds have to run on every render, so they cannot be
	// moved below a bailout, and an early return leaves them declared-then-unused
	// on the redirect path.
	return shouldRedirectToLibrary ? null : (
		// The pill suppression: while this stage is on screen, the single-flow
		// edit session's player slot is the progress surface, so the shared
		// upload pill stands down for this flow's own queue items.
		<DashboardLayout
			activeTab={ isAtLimit ? 'library' : 'upload' }
			uploadPillSuppressContext={ UPLOAD_CONTEXT }
		>
			<UploadOnboarding
				isFree={ isFree }
				isUnlimited={ isUnlimited }
				isAtLimit={ isAtLimit }
				step={ step }
				prev={ prev }
				go={ go }
				onExitDone={ onExitDone }
			/>
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
