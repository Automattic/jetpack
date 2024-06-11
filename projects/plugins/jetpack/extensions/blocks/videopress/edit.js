import apiFetch from '@wordpress/api-fetch';
import { isBlobURL } from '@wordpress/blob';
import {
	BlockControls,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	ExternalLink,
	PanelBody,
	ResizableBox,
	SandBox,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	Tooltip,
} from '@wordpress/components';
import {
	compose,
	createHigherOrderComponent,
	usePrevious,
	withInstanceId,
} from '@wordpress/compose';
import { useSelect, withDispatch, withSelect } from '@wordpress/data';
import {
	Component,
	createInterpolateElement,
	createRef,
	Fragment,
	useEffect,
} from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import clsx from 'clsx';
import { get, indexOf } from 'lodash';
import { VideoPressIcon } from '../../shared/icons';
import { VideoPressBlockProvider } from './components';
import { VIDEO_PRIVACY } from './constants';
import Loading from './loading';
import ResumableUpload from './resumable-upload';
import SeekbarColorSettings from './seekbar-color-settings';
import TracksEditor from './tracks-editor';
import { UploadingEditor } from './uploading-editor';
import { getVideoPressUrl } from './url';
import { getClassNames, removeFileNameExtension } from './utils';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const VideoPressEdit = CoreVideoEdit =>
	class extends Component {
		constructor( props ) {
			super( ...arguments );
			this.state = {
				media: null,
				isFetchingMedia: false,
				fallback: false,
				interactive: false,
				rating: null,
				lastRequestedMediaId: null,
				isUpdatingRating: false,
				allowDownload: null,
				privacySetting: VIDEO_PRIVACY.SITE_DEFAULT,
				isUpdatingAllowDownload: false,
				fileForUpload: props.fileForImmediateUpload,
				isUpdatingIsPrivate: false,
				isEditingWhileUploading: false,
				isUploadComplete: false,
				lastPosterValueSource: '',
			};
			this.posterImageButton = createRef();
			this.previewCacheReloadTimer = null;
			this.previewFailuresCount = 0;
		}

		static getDerivedStateFromProps( nextProps, state ) {
			const newState = {};
			if ( ! nextProps.isSelected && state.interactive ) {
				// We only want to change this when the block is not selected, because changing it when
				// the block becomes selected makes the overlap disappear too early. Hiding the overlay
				// happens on mouseup when the overlay is clicked.
				newState.interactive = false;
			}

			if ( state.fileForUpload && ! state.isEditingWhileUploading ) {
				const isResumableUploading =
					null !== state.fileForUpload && state.fileForUpload instanceof File;
				if ( isResumableUploading ) {
					newState.isEditingWhileUploading = true;
				}
			}

			return Object.keys( newState ).length ? newState : null;
		}

		hideOverlay = () => {
			// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
			// changing, because that happens on mouse down, and the overlay immediately disappears,
			// and the mouse event can end up in the preview content. We can't use onClick on
			// the overlay to hide it either, because then the editor misses the mouseup event, and
			// thinks we're multi-selecting blocks.
			this.setState( { interactive: true } );
		};

		async componentDidMount() {
			const { guid } = this.props.attributes;
			if ( ! guid ) {
				await this.setGuid();
			} else {
				this.setTracks( guid );
			}

			this.setRatingAndAllowDownload();
		}

		setRatingAndAllowDownload = async () => {
			const id = get( this.props, 'attributes.id' );
			const media = await this.requestMedia( id );
			let rating = get( media, 'jetpack_videopress.rating' );
			const allowDownload = get( media, 'jetpack_videopress.allow_download' );
			const privacySetting = get(
				media,
				'jetpack_videopress.privacy_setting',
				VIDEO_PRIVACY.SITE_DEFAULT
			);

			if ( rating ) {
				// X-18 was previously supported but is now removed to better comply with our TOS.
				if ( 'X-18' === rating ) {
					rating = 'R-17';
				}
				this.setState( { rating } );
			}

			if ( 'undefined' !== typeof allowDownload ) {
				this.setState( { allowDownload: !! allowDownload } );
			}

			if ( 'undefined' !== typeof privacySetting ) {
				this.setState( { privacySetting } );
			}
		};

		async componentDidUpdate( prevProps ) {
			const {
				attributes,
				invalidateCachedEmbedPreview,
				preview,
				setAttributes,
				url,
				isFetchingPreview,
			} = this.props;

			if ( attributes.id !== prevProps.attributes.id ) {
				await this.setGuid();
				this.setRatingAndAllowDownload();
			}

			let invalidationTriggered = false;
			if ( url && url !== prevProps.url ) {
				// Due to a current bug in Gutenberg (https://github.com/WordPress/gutenberg/issues/16831), the
				// `SandBox` component is not rendered again when the injected `html` prop changes. To work around that,
				// we invalidate the cached preview of the embed VideoPress player in order to force the rendering of a
				// new instance of the `SandBox` component that ensures the injected `html` will be rendered.
				invalidateCachedEmbedPreview( url );
				invalidationTriggered = true;
			}

			if ( preview ) {
				const sandboxClassnames = getClassNames(
					preview.html,
					clsx( 'wp-block-embed', 'is-type-video', 'is-provider-videopress' ),
					false
				);

				// Reset preview failure count so we can retry a preview later if a problem occurs.
				this.previewFailuresCount = 0;

				// We set videoPressClassNames attribute to be used in ./save.js
				setAttributes( { videoPressClassNames: sandboxClassnames } );
			} else if ( ! isFetchingPreview && ! invalidationTriggered && this.props.attributes.guid ) {
				// If we have a guid but no preview, we may want to reload the block
				this.schedulePreviewCacheReload();
			}
		}

		schedulePreviewCacheReload = () => {
			const { invalidateCachedEmbedPreview, url } = this.props;
			if ( null === this.previewCacheReloadTimer && this.previewFailuresCount < 5 ) {
				this.previewFailuresCount++;
				this.previewCacheReloadTimer = setTimeout( () => {
					invalidateCachedEmbedPreview( url );
					this.previewCacheReloadTimer = null;
				}, this.previewFailuresCount * 2000 );
			}
		};

		fallbackToCore = () => {
			this.props.setAttributes( { guid: undefined } );
			this.setState( { fallback: true } );
		};

		setGuid = async () => {
			const { attributes, setAttributes } = this.props;
			const { id } = attributes;

			if ( ! id ) {
				setAttributes( { guid: undefined } );
				return;
			}

			try {
				const media = await this.requestMedia( id );

				if ( null === media ) {
					return;
				}

				const guid = get( media, 'jetpack_videopress.guid' );
				if ( guid ) {
					setAttributes( { guid } );
					this.setTracks( guid );
				} else {
					this.fallbackToCore();
				}
			} catch ( e ) {
				this.setState( { isFetchingMedia: false } );
				this.fallbackToCore();
			}
		};

		requestMedia = async id => {
			if ( ! id ) {
				return null;
			}

			if ( null !== this.state.media && this.state.lastRequestedMediaId === id ) {
				return this.state.media;
			}

			this.setState( { isFetchingMedia: true } );
			const media = await apiFetch( { path: `/wp/v2/media/${ id }` } )
				.catch( () => {
					// Renders the fallback in the editor when there is an error fetching the media. Do not clear
					// the guid, as this would cause the placeholder to render on the frontend for posts saved in
					// this state, resulting in inconsistent behavior.
					this.setState( { fallback: true } );
					return null;
				} )
				.finally( () => {
					this.setState( { isFetchingMedia: false } );
				} );

			const { id: currentId } = this.props.attributes;
			if ( id !== currentId ) {
				// Video was changed in the editor while fetching data for the previous video;
				return null;
			}

			this.setState( { media, lastRequestedMediaId: id } );

			return media;
		};

		setTracks = guid => {
			const { setAttributes } = this.props;

			if ( ! guid ) {
				return;
			}

			apiFetch( {
				url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }`,
				credentials: 'omit',
				global: true,
			} ).then( videoInfo => {
				// Convert API object response to an array that works better with the tracks editor component
				const tracks = [];
				Object.keys( videoInfo.tracks ).forEach( kind => {
					for ( const srcLang in videoInfo.tracks[ kind ] ) {
						const track = videoInfo.tracks[ kind ][ srcLang ];
						tracks.push( {
							src: track.src,
							kind,
							srcLang,
							label: track.label,
						} );
					}
				} );
				setAttributes( { videoPressTracks: tracks } );
			} );
		};

		switchToEditing = () => {
			this.props.setAttributes( {
				id: undefined,
				guid: undefined,
				src: undefined,
			} );
		};

		onSelectPoster = image => {
			const { setAttributes } = this.props;
			setAttributes( { poster: image.url } );
			this.setState( { videoPosterImageData: image } );
		};

		onRemovePoster = () => {
			const { setAttributes } = this.props;
			setAttributes( { poster: '' } );
			this.setState( { videoPosterImageData: null } );

			// Move focus back to the Media Upload button.
			this.posterImageButton.current.focus();
		};

		toggleAttribute = attribute => {
			return newValue => {
				this.props.setAttributes( { [ attribute ]: newValue } );
			};
		};

		getAutoplayHelp = checked => {
			return checked
				? __( 'Note: Autoplaying videos may cause usability issues for some visitors.', 'jetpack' )
				: null;
		};

		getPreloadHelp() {
			const { attributes } = this.props;
			return 'auto' === attributes.preload
				? __(
						'Note: Automatically downloading videos may cause issues if there are many videos displayed on the same page.',
						'jetpack'
				  )
				: null;
		}

		getPrivacySettingHelp = selectedSetting => {
			const privacySetting = parseInt( selectedSetting, 10 );
			if ( VIDEO_PRIVACY.PRIVATE === privacySetting ) {
				return __( 'Restrict views to members of this site', 'jetpack' );
			}

			if ( VIDEO_PRIVACY.PUBLIC === privacySetting ) {
				return __( 'Video can be viewed by anyone', 'jetpack' );
			}

			return __( 'Follow the site privacy setting', 'jetpack' );
		};

		renderControlLabelWithTooltip( label, tooltipText ) {
			return (
				<Tooltip text={ tooltipText } position="top">
					<span>{ label }</span>
				</Tooltip>
			);
		}

		onChangeRating = rating => {
			const originalRating = this.state.rating;

			// X-18 was previously supported but is now removed to better comply with our TOS.
			if ( 'X-18' === rating ) {
				rating = 'R-17';
			}

			if ( -1 === indexOf( [ 'G', 'PG-13', 'R-17' ], rating ) ) {
				return;
			}

			this.updateMetaApiCall(
				{ rating: rating },
				() => this.setState( { isUpdatingRating: true, rating } ),
				() => this.setState( { rating: originalRating } ),
				() => this.setState( { isUpdatingRating: false } )
			);
		};

		onChangeAllowDownload = allowDownload => {
			const originalValue = this.state.allowDownload;

			this.updateMetaApiCall(
				{ allow_download: allowDownload ? 1 : 0 },
				() => this.setState( { isUpdatingAllowDownload: true, allowDownload } ),
				() => this.setState( { allowDownload: originalValue } ),
				() => this.setState( { isUpdatingAllowDownload: false } )
			);
		};

		onChangePrivacySetting = privacySetting => {
			const originalValue = this.state.privacySetting;

			this.updateMetaApiCall(
				{ privacy_setting: privacySetting },
				() => this.setState( { isUpdatingPrivacySetting: true, privacySetting } ),
				() => this.setState( { privacySetting: originalValue } ),
				() => this.setState( { isUpdatingPrivacySetting: false } )
			);
		};

		updateMetaApiCall = ( requestData, onBeforeApiCall, onRevert, onAfterApiCall ) => {
			const { invalidateCachedEmbedPreview, url } = this.props;
			const { id } = this.props.attributes;

			if ( ! id ) {
				return;
			}

			onBeforeApiCall();

			const apiRequestData = { id: id };
			Object.assign( apiRequestData, requestData );

			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: apiRequestData,
			} )
				.then( result => {
					// check for wpcom status field, if set
					if ( status in result && 200 !== result.status ) {
						onRevert();
						return;
					}
				} )
				.catch( () => onRevert() )
				.finally( () => {
					onAfterApiCall();
					invalidateCachedEmbedPreview( url );
				} );
		};

		render() {
			const {
				attributes,
				instanceId,
				isFetchingPreview,
				isUploading,
				preview,
				resumableUploadEnabled,
				setAttributes,
			} = this.props;

			const {
				fallback,
				fileForUpload,
				isFetchingMedia,
				isUpdatingRating,
				interactive,
				rating,
				allowDownload,
				privacySetting,
				isUpdatingAllowDownload,
				isUpdatingPrivacySetting,
				videoPosterImageData,
			} = this.state;

			const {
				autoplay,
				caption,
				controls,
				guid,
				loop,
				muted,
				playsinline,
				poster,
				preload,
				useAverageColor,
				videoPressTracks,
				isVideoPressExample,
				src,
			} = attributes;

			if ( isVideoPressExample && src ) {
				return <img src={ src } alt={ caption } />;
			}

			const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;
			const hasPoster = !! ( poster || videoPosterImageData );

			const blockSettings = (
				<Fragment>
					<BlockControls group="block">
						<TracksEditor
							tracks={ videoPressTracks }
							onChange={ newTracks => {
								setAttributes( { videoPressTracks: newTracks } );
							} }
							guid={ guid }
						/>
					</BlockControls>
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								className="components-icon-button components-toolbar__control"
								text={ __( 'Replace', 'jetpack' ) }
								onClick={ this.switchToEditing }
							/>
						</ToolbarGroup>
					</BlockControls>
					<InspectorControls>
						<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
							<ToggleControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Autoplay', 'jetpack' ),
									/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
									__( 'Start playing the video as soon as the page loads', 'jetpack' )
								) }
								onChange={ this.toggleAttribute( 'autoplay' ) }
								checked={ autoplay }
								help={ this.getAutoplayHelp }
							/>
							<ToggleControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Loop', 'jetpack' ),
									/* translators: Tooltip describing the "loop" option for the VideoPress player */
									__( 'Restarts the video when it reaches the end', 'jetpack' )
								) }
								onChange={ this.toggleAttribute( 'loop' ) }
								checked={ loop }
							/>
							<ToggleControl
								label={ __( 'Muted', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'muted' ) }
								checked={ muted }
							/>
							<ToggleControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Playback Controls', 'jetpack' ),
									/* translators: Tooltip describing the "controls" option for the VideoPress player */
									__( 'Display the video playback controls', 'jetpack' )
								) }
								onChange={ this.toggleAttribute( 'controls' ) }
								checked={ controls }
							/>
							<ToggleControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Play Inline', 'jetpack' ),
									/* translators: Tooltip describing the "playsinline" option for the VideoPress player */
									__( 'Play the video inline instead of full-screen on mobile devices', 'jetpack' )
								) }
								onChange={ this.toggleAttribute( 'playsinline' ) }
								checked={ playsinline }
							/>
							<SelectControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Preload', 'jetpack' ),
									/* translators: Tooltip describing the "preload" option for the VideoPress player */
									__( 'Content to dowload before the video is played', 'jetpack' )
								) }
								value={ preload ?? '' }
								onChange={ value => setAttributes( { preload: value } ) }
								options={ [
									{ value: 'auto', label: _x( 'Auto', 'VideoPress preload setting', 'jetpack' ) },
									{
										value: 'metadata',
										label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack' ),
									},
									{ value: 'none', label: _x( 'None', 'VideoPress preload setting', 'jetpack' ) },
								] }
								help={ this.getPreloadHelp() }
							/>
							<MediaUploadCheck>
								<BaseControl
									className="editor-video-poster-control"
									label={ __( 'Poster Image', 'jetpack' ) }
								>
									<MediaUpload
										title={ __( 'Select Poster Image', 'jetpack' ) }
										onSelect={ this.onSelectPoster }
										allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
										render={ ( { open } ) => (
											<Button
												variant="secondary"
												onClick={ open }
												ref={ this.posterImageButton }
												aria-describedby={ videoPosterDescription }
											>
												{ ! hasPoster
													? __( 'Select Poster Image', 'jetpack' )
													: __(
															'Replace image',
															'jetpack',
															/* dummy arg to avoid bad minification */ 0
													  ) }
											</Button>
										) }
									/>
									<p id={ videoPosterDescription } hidden>
										{ hasPoster
											? sprintf(
													/* translators: Placeholder is an image URL. */
													__( 'The current poster image url is %s', 'jetpack' ),
													poster ?? videoPosterImageData
											  )
											: __( 'There is no poster image currently selected', 'jetpack' ) }
									</p>
									{ hasPoster && (
										<Button onClick={ this.onRemovePoster } variant="link" isDestructive>
											{ __( 'Remove Poster Image', 'jetpack' ) }
										</Button>
									) }
								</BaseControl>
							</MediaUploadCheck>
							{ createInterpolateElement(
								__( 'Send us your <a>VideoPress feedback</a>', 'jetpack' ),
								{
									a: <ExternalLink href="https://automattic.survey.fm/videopress-feedback" />,
								}
							) }
						</PanelBody>

						<SeekbarColorSettings
							{ ...{ attributes, setAttributes, useAverageColor } }
							toggleAttribute={ this.toggleAttribute }
						/>

						<PanelBody title={ __( 'Video File Settings', 'jetpack' ) }>
							<SelectControl
								label={ _x( 'Rating', 'The age rating for this video.', 'jetpack' ) }
								value={ rating ?? '' }
								disabled={ isFetchingMedia || isUpdatingRating }
								options={ [
									{
										label: _x( 'G', 'Video rating for "General Audiences".', 'jetpack' ),
										value: 'G',
									},
									{
										label: _x(
											'PG-13',
											'Video rating for "Parental Guidance", unsuitable for children under 13.',
											'jetpack'
										),
										value: 'PG-13',
									},
									{
										label: _x(
											'R',
											'Video rating for "Restricted", not recommended for children under 17.',
											'jetpack'
										),
										value: 'R-17',
									},
								] }
								onChange={ this.onChangeRating }
							/>
							<ToggleControl
								label={ this.renderControlLabelWithTooltip(
									__( 'Allow download', 'jetpack' ),
									/* translators: Tooltip describing the "allow download" option for the VideoPress player */
									__(
										'Display download option and allow viewers to download this video',
										'jetpack'
									)
								) }
								onChange={ this.onChangeAllowDownload }
								checked={ allowDownload }
								disabled={ isFetchingMedia || isUpdatingAllowDownload }
							/>
							<SelectControl
								label={ __( 'Video Privacy', 'jetpack' ) }
								help={ this.getPrivacySettingHelp( privacySetting ) }
								onChange={ this.onChangePrivacySetting }
								value={ privacySetting ?? '' }
								options={ [
									{
										value: VIDEO_PRIVACY.SITE_DEFAULT,
										label: _x( 'Site Default', 'VideoPress privacy setting', 'jetpack' ),
									},
									{
										value: VIDEO_PRIVACY.PUBLIC,
										label: _x( 'Public', 'VideoPress privacy setting', 'jetpack' ),
									},
									{
										value: VIDEO_PRIVACY.PRIVATE,
										label: _x( 'Private', 'VideoPress privacy setting', 'jetpack' ),
									},
								] }
								disabled={ isFetchingMedia || isUpdatingPrivacySetting }
							/>
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);

			const filesSelected = files => {
				this.setState( { fileForUpload: files[ 0 ] } );
			};

			// Handle Media Library selection
			// Same as core video block media selection while adding video guid to attributes
			const mediaItemSelected = media => {
				if ( ! media || ! media.url ) {
					// In this case there was an error
					// previous attributes should be removed
					// because they may be temporary blob urls.
					setAttributes( {
						src: undefined,
						id: undefined,
						poster: undefined,
					} );
					return;
				}

				this.props.setAttributes( {
					src: media.url,
					id: media.id,
					poster: media.image?.src !== media.icon ? media.image?.src : undefined,
				} );

				if ( media.videopress_guid ) {
					this.props.setAttributes( { guid: media.videopress_guid } );
				}
			};

			/**
			 * Determines if api requests should be made via the `gutenberg-video-upload` script (Jetpack only).
			 *
			 * @returns {boolean} if the upload script should be used or not.
			 */
			const shouldUseJetpackVideoFetch = () => {
				return 'videoPressUploadPoster' in window;
			};

			const filename = escapeHTML(
				fileForUpload ? removeFileNameExtension( fileForUpload.name ) : ''
			);

			const uploadFinished = ( { mediaId, guid: videoGuid, src: videoSrc } ) => {
				this.setState( {
					title: this.state.title ?? filename, // Make sure we store the filename here, as fileForUpload won't exist anymore
					fileForUpload: null,
					isUploadComplete: !! mediaId,
					isEditingWhileUploading: mediaId ? this.state.isEditingWhileUploading : false,
				} );

				if ( mediaId && videoGuid && videoSrc ) {
					setAttributes( { id: mediaId, guid: videoGuid, src: videoSrc } );
				}
			};

			const onChangeTitle = newTitle => {
				this.setState( { title: newTitle } );
			};

			const onVideoFrameSelected = ms => {
				this.setState( {
					videoFrameSelectedInMillis: ms,
					videoPosterImageData: null,
				} );
			};

			const sendUpdateTitleRequest = () => {
				const title = this.state.title;
				this.updateMetaApiCall(
					{ title: title },
					() => this.setState( { isUpdatingTitle: true, title } ),
					() => this.setState( { title: title } ),
					() => this.setState( { isUpdatingTitle: false } )
				);
			};

			const sendUpdatePosterFromMillisecondsRequest = () => {
				return __sendUpdatePoster( {
					at_time: this.state.videoFrameSelectedInMillis,
					is_millisec: true,
				} );
			};

			const sendUpdatePosterRequest = () => {
				return __sendUpdatePoster( {
					poster_attachment_id: this.state.videoPosterImageData.id,
				} );
			};

			const updatePosterFromApiResult = result => {
				if ( result.generating ) {
					startPollingForPosterImage();
				} else {
					updatePosterImage( result.poster );
				}
			};

			const getPosterImage = () => {
				if ( shouldUseJetpackVideoFetch() ) {
					return window.videoPressGetPoster( guid );
				}

				return apiFetch( {
					path: `/videos/${ guid }/poster`,
					apiNamespace: 'rest/v1.1',
					global: true,
					method: 'GET',
				} );
			};

			const startPollingForPosterImage = () => {
				setTimeout( () => {
					getPosterImage().then( result => updatePosterFromApiResult( result ) );
				}, 2000 );
			};

			const updatePosterImage = newPosterImage => {
				if ( newPosterImage ) {
					setAttributes( { poster: newPosterImage } );
				}
			};

			const __sendUpdatePoster = data => {
				if ( shouldUseJetpackVideoFetch() ) {
					return window
						.videoPressUploadPoster( guid, data )
						.then( result => updatePosterFromApiResult( result ) );
				}

				apiFetch( {
					path: `/videos/${ guid }/poster`,
					apiNamespace: 'rest/v1.1',
					method: 'POST',
					global: true,
					data: data,
				} ).catch( e => e );
			};

			const saveEditorData = () => {
				const { title, videoFrameSelectedInMillis } = this.state;

				if ( title ) {
					sendUpdateTitleRequest();
				}

				if ( videoPosterImageData ) {
					sendUpdatePosterRequest();
				} else if (
					// Check if videoFrameSelectedInMillis is not undefined or null instead of bool check to allow 0ms. selection
					'undefined' !== typeof videoFrameSelectedInMillis &&
					null !== videoFrameSelectedInMillis
				) {
					sendUpdatePosterFromMillisecondsRequest();
				}
			};

			const dismissEditor = () => {
				this.setState( { isEditingWhileUploading: false } );
				saveEditorData();
			};

			const isResumableUploading = null != fileForUpload && fileForUpload.name;

			if ( isResumableUploading || this.state.isEditingWhileUploading ) {
				const title = this.state.title ?? filename;

				return (
					<UploaderBlock
						fileForUpload={ fileForUpload }
						filename={ filename }
						uploadFinished={ uploadFinished }
						blockSettings={ blockSettings }
						onDismissEditor={ dismissEditor }
						isUploadComplete={ this.state.isUploadComplete }
						onSelectPoster={ this.onSelectPoster }
						onRemovePoster={ this.onRemovePoster }
						onChangeTitle={ onChangeTitle }
						title={ title }
						videoPosterImageData={ this.state.videoPosterImageData }
						onVideoFrameSelected={ onVideoFrameSelected }
						onSave={ saveEditorData }
					/>
				);
			}

			/*
			 * The Loading/CoreVideoEdit blocks should be in the tree if :
			 *     - We don't have a video GUID
			 *     - Or we're uploading a video
			 *     - Or we're in fallback mode (to display a video hosted locally for instance)
			 * In all other cases, we should be able to safely display the Loading/VpBlock branch.
			 */

			const isFetchingVideo = isFetchingMedia || isFetchingPreview;
			const renderCoreVideoAndLoadingBlocks = fallback || isUploading || ! guid;
			const displayCoreVideoBlock =
				renderCoreVideoAndLoadingBlocks && ! isUploading && ! isFetchingVideo;

			// In order for the media placeholder to keep its state for error messages, we need to keep the CoreVideoEdit component in the tree during file uploads.
			// Keep this section separate so the CoreVideoEdit stays in the tree, once we have a video, we don't need it anymore.
			const coreVideoFragment = (
				<Fragment>
					<div className={ ! isUploading && ! isFetchingVideo ? 'videopress-block-hide' : '' }>
						<Loading
							text={
								isUploading
									? __( 'Uploading…', 'jetpack' )
									: __(
											'Generating preview…',
											'jetpack',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
						/>
					</div>
					<div className={ ! displayCoreVideoBlock ? 'videopress-block-hide' : '' }>
						<CoreVideoEdit { ...this.props } />
					</div>
				</Fragment>
			);

			if ( renderCoreVideoAndLoadingBlocks ) {
				return resumableUploadEnabled ? (
					<VideoPressBlockProvider
						onFilesSelected={ filesSelected }
						onMediaItemSelected={ mediaItemSelected }
					>
						{ coreVideoFragment }
					</VideoPressBlockProvider>
				) : (
					<Fragment>{ coreVideoFragment }</Fragment>
				);
			}

			const { html, scripts } = preview ? preview : { html: null, scripts: null };

			// If we don't have a preview or we're currently fetching it, render the loading block
			const shouldRenderLoadingBlock = isFetchingVideo || ! preview;

			// Render logic note :
			// We make sure to exclude the VpBlock from the tree on preview reload so the HTML gets reloaded
			// as we may receive the exact same HTML after the preview is resolved.
			// Eslint disable note :
			// Disabled because the overlay div doesn't actually have a role or functionality
			// as far as the user is concerned. We're just catching the first click so that
			// the block can be selected without interacting with the embed preview that the overlay covers.
			/* eslint-disable jsx-a11y/no-static-element-interactions */
			return (
				<Fragment>
					{ blockSettings }
					{ shouldRenderLoadingBlock && (
						<Loading text={ __( 'Generating preview…', 'jetpack' ) } />
					) }
					{ ! shouldRenderLoadingBlock && (
						<VpBlock
							{ ...this.props }
							hideOverlay={ this.hideOverlay }
							html={ html }
							scripts={ scripts }
							interactive={ interactive }
							caption={ caption }
						/>
					) }
				</Fragment>
			);
		}
	};

const UploaderBlock = props => {
	const blockProps = useBlockProps( {
		className: 'resumable-upload',
	} );

	const {
		onChangeTitle,
		title,
		filename,
		onSelectPoster,
		onRemovePoster,
		videoPosterImageData,
		fileForUpload,
		isUploadComplete,
		onDismissEditor,
		onSave,
		onVideoFrameSelected,
	} = props;

	// Avoid triggering save action multiple times
	const isSaving = useSelect( select => select( 'core/editor' ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );

	useEffect( () => {
		if ( isSaving && ! wasSaving ) {
			onSave();
		}
	}, [ isSaving, wasSaving, onSave ] );

	return (
		<VideoPressBlockProvider onUploadFinished={ props.uploadFinished }>
			<Fragment>
				{ props.blockSettings }
				<div { ...blockProps }>
					<div className="uploader-block__logo">
						<Icon icon={ VideoPressIcon } />
						<div className="uploader-block__logo-text">{ __( 'VideoPress', 'jetpack' ) }</div>
					</div>
					<UploadingEditor
						file={ fileForUpload }
						filename={ filename }
						title={ title }
						onChangeTitle={ onChangeTitle }
						onSelectPoster={ onSelectPoster }
						onRemovePoster={ onRemovePoster }
						videoPosterImageData={ videoPosterImageData }
						onVideoFrameSelected={ onVideoFrameSelected }
					/>
					{ ! isUploadComplete && <ResumableUpload file={ fileForUpload } /> }
					{ isUploadComplete && (
						<div className="uploader-block__upload-complete">
							<span>{ __( 'Upload Complete!', 'jetpack' ) } 🎉</span>
							<Button variant="primary" onClick={ onDismissEditor }>
								{ __( 'Done', 'jetpack' ) }
							</Button>
						</div>
					) }
				</div>
			</Fragment>
		</VideoPressBlockProvider>
	);
};

// The actual, final rendered video player markup
// In a separate function component so that `useBlockProps` could be called.
export const VpBlock = props => {
	let { scripts } = props;
	const { html, interactive, caption, isSelected, hideOverlay, attributes, setAttributes } = props;

	const { align, className, videoPressClassNames, maxWidth } = attributes;

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-video', className, videoPressClassNames, {
			[ `align${ align }` ]: align,
		} ),
	} );

	const onBlockResize = ( event, direction, elem ) => {
		let newMaxWidth = getComputedStyle( elem ).width;
		const parentElement = elem.parentElement;
		if ( null !== parentElement ) {
			const parentWidth = getComputedStyle( elem.parentElement ).width;
			if ( newMaxWidth === parentWidth ) {
				newMaxWidth = '100%';
			}
		}

		setAttributes( { maxWidth: newMaxWidth } );
	};

	if ( typeof scripts !== 'object' ) {
		scripts = [];
	}

	if ( window.videopressAjax ) {
		const videopresAjaxURLBlob = new Blob(
			[ `var videopressAjax = ${ JSON.stringify( window.videopressAjax ) };` ],
			{
				type: 'text/javascript',
			}
		);

		scripts.push( URL.createObjectURL( videopresAjaxURLBlob ), window.videopressAjax.bridgeUrl );
	}

	return (
		<figure { ...blockProps }>
			<div className="wp-block-embed__wrapper">
				<ResizableBox
					enable={ {
						top: false,
						bottom: false,
						left: true,
						right: true,
					} }
					maxWidth="100%"
					size={ { width: maxWidth } }
					style={ { margin: 'auto' } }
					onResizeStop={ onBlockResize }
				>
					<SandBox html={ html } scripts={ scripts } type={ videoPressClassNames } />
				</ResizableBox>
			</div>

			{
				/*
					Disable the video player when the block isn't selected,
					so the user clicking on it won't play the
					video when the controls are enabled.
				*/
				! interactive && (
					<div className="block-library-embed__interactive-overlay" onMouseUp={ hideOverlay } />
				)
			}
			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…', 'jetpack' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
};

export default createHigherOrderComponent(
	compose( [
		withSelect( ( _select, ownProps ) => {
			const {
				autoplay,
				controls,
				fileForImmediateUpload,
				guid,
				loop,
				muted,
				playsinline,
				poster,
				preload,
				seekbarColor,
				seekbarLoadingColor,
				seekbarPlayedColor,
				src,
				useAverageColor,
			} = ownProps.attributes;
			const { getEmbedPreview, isRequestingEmbedPreview } = _select( 'core' );

			const url = getVideoPressUrl( guid, {
				autoplay,
				controls,
				loop,
				muted,
				playsinline,
				poster,
				preload,
				seekbarColor,
				seekbarLoadingColor,
				seekbarPlayedColor,
				useAverageColor,
			} );

			const preview = !! url && getEmbedPreview( url );

			const isFetchingEmbedPreview = !! url && isRequestingEmbedPreview( url );
			const resumableUploadEnabled = !! window.videoPressResumableEnabled;
			const isUploading = ! resumableUploadEnabled && isBlobURL( src );

			return {
				fileForImmediateUpload,
				isFetchingPreview: isFetchingEmbedPreview,
				isUploading,
				preview,
				resumableUploadEnabled,
				url,
			};
		} ),
		withDispatch( dispatch => {
			const invalidateCachedEmbedPreview = url => {
				dispatch( 'core/data' ).invalidateResolution( 'core', 'getEmbedPreview', [ url ] );
			};
			return {
				invalidateCachedEmbedPreview,
			};
		} ),
		withInstanceId,
		VideoPressEdit,
	] ),
	'withVideoPressEdit'
);
