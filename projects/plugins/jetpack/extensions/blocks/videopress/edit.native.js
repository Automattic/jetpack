/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	BlockCaption,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadProgress,
	MEDIA_TYPE_VIDEO,
	BlockControls,
	VIDEO_ASPECT_RATIO,
	VideoPlayer,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Icon, ToolbarButton, ToolbarGroup, PanelBody } from '@wordpress/components';
import { withPreferredColorScheme, compose, createHigherOrderComponent } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { doAction, hasAction } from '@wordpress/hooks';
import { __, sprintf } from '@wordpress/i18n';
import { video as SvgIcon, replace } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import {
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';
import { isURL, getProtocol } from '@wordpress/url';
/**
 * External dependencies
 */
import { ActivityIndicator, View, TouchableWithoutFeedback, Text } from 'react-native';
/**
 * Internal dependencies
 */
import VideoCommonSettings from './edit-common-settings';
import SvgIconRetry from './icon-retry';
import style from './style.scss';
import { pickGUIDFromUrl } from './utils';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

class VideoPressEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isCaptionSelected: false,
			videoContainerHeight: 0,
			isUploadInProgress: false,
			isUploadFailed: false,
			isLoadingMetadata: false,
			metadata: {},
		};

		this.mediaUploadStateReset = this.mediaUploadStateReset.bind( this );
		this.onSelectMediaUploadOption = this.onSelectMediaUploadOption.bind( this );
		this.onSelectURL = this.onSelectURL.bind( this );
		this.finishMediaUploadWithSuccess = this.finishMediaUploadWithSuccess.bind( this );
		this.finishMediaUploadWithFailure = this.finishMediaUploadWithFailure.bind( this );
		this.updateMediaProgress = this.updateMediaProgress.bind( this );
		this.onVideoPressed = this.onVideoPressed.bind( this );
		this.onVideoContanerLayout = this.onVideoContanerLayout.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
	}

	async componentDidMount() {
		const { attributes } = this.props;
		const { guid } = attributes;
		if ( attributes.id && getProtocol( attributes.src ) === 'file:' ) {
			mediaUploadSync();
		}

		// Try to infer the VideoPress ID from the source upon component mount.
		// If the ID already exists, fetch the metadata to get the video URL.
		if ( ! guid ) {
			await this.setGuid();
		} else {
			await this.fetchMetadata( guid );
		}
	}

	componentWillUnmount() {
		// This action will only exist if the user pressed the trash button on the block holder.
		if ( hasAction( 'blocks.onRemoveBlockCheckUpload' ) && this.state.isUploadInProgress ) {
			doAction( 'blocks.onRemoveBlockCheckUpload', this.props.attributes.id );
		}
	}

	static getDerivedStateFromProps( props, state ) {
		return {
			// Avoid a UI flicker in the toolbar by insuring that isCaptionSelected
			// is updated immediately any time the isSelected prop becomes false.
			isCaptionSelected: props.isSelected && state.isCaptionSelected,
			// Reset metadata when "guid" attribute is not defined.
			metadata: props.attributes?.guid ? state.metadata : {},
		};
	}

	async setGuid( value ) {
		const { setAttributes, attributes } = this.props;
		const { src } = attributes;
		// If no value is passed, we try to extract the VideoPress ID from the source.
		const guid = value ?? pickGUIDFromUrl( src ) ?? undefined;
		setAttributes( { guid } );
		if ( guid ) {
			await this.fetchMetadata( guid );
		}
	}

	async fetchMetadata( guid ) {
		this.setState( { isLoadingMetadata: true } );
		try {
			const metadata = await apiFetch( {
				path: `/rest/v1.1/videos/${ guid }`,
			} );
			this.setState( { metadata, isLoadingMetadata: false } );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( `Couldn't fetch metadata of VideoPress video with ID = ${ guid }`, error );
			this.setState( { isLoadingMetadata: false } );
		}
	}

	onVideoPressed() {
		const { attributes } = this.props;

		if ( this.state.isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if ( attributes.id && getProtocol( attributes.src ) === 'file:' ) {
			requestImageFailedRetryDialog( attributes.id );
		}

		this.setState( {
			isCaptionSelected: false,
		} );
	}

	onFocusCaption() {
		if ( ! this.state.isCaptionSelected ) {
			this.setState( { isCaptionSelected: true } );
		}
	}

	updateMediaProgress( payload ) {
		const { setAttributes } = this.props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! this.state.isUploadInProgress ) {
			this.setState( { isUploadInProgress: true } );
		}
	}

	finishMediaUploadWithSuccess( payload ) {
		const { setAttributes } = this.props;
		const { mediaUrl, mediaServerId, metadata = {} } = payload;
		const { videopressGUID } = metadata;
		setAttributes( { src: mediaUrl, id: mediaServerId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
		this.setGuid( videopressGUID );
	}

	finishMediaUploadWithFailure( payload ) {
		const { setAttributes } = this.props;
		setAttributes( { id: payload.mediaId } );
		this.setState( { isUploadInProgress: false, isUploadFailed: true } );
	}

	mediaUploadStateReset() {
		const { setAttributes } = this.props;
		setAttributes( { id: null, src: null, guid: null } );
		this.setState( { isUploadInProgress: false, isUploadFailed: false } );
	}

	onSelectMediaUploadOption( payload ) {
		const { setAttributes } = this.props;
		const { id, url, metadata = {} } = payload;
		const { videopressGUID } = metadata;
		setAttributes( { id, src: url } );
		this.setGuid( videopressGUID );
	}

	onSelectURL( url ) {
		const { createErrorNotice, setAttributes } = this.props;

		if ( isURL( url ) ) {
			setAttributes( { id: url, src: url } );
		} else {
			createErrorNotice( __( 'Invalid URL.', 'jetpack' ) );
		}
	}

	onVideoContanerLayout( event ) {
		const { width } = event.nativeEvent.layout;
		const height = width / VIDEO_ASPECT_RATIO;
		if ( height !== this.state.videoContainerHeight ) {
			this.setState( { videoContainerHeight: height } );
		}
	}

	getIcon( iconType ) {
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return <Icon icon={ SvgIconRetry } { ...style.icon } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = this.props.getStylesFromColorScheme( style.icon, style.iconDark );
				break;
			case ICON_TYPE.UPLOAD:
				iconStyle = this.props.getStylesFromColorScheme(
					style.iconUploading,
					style.iconUploadingDark
				);
				break;
		}

		return <Icon icon={ SvgIcon } { ...iconStyle } />;
	}

	getVideoURL() {
		const { attributes } = this.props;
		const { guid } = attributes;
		const { metadata = {} } = this.state;

		// Private videos will open in the player for logged in users with the WordPress.com URL.
		// However, they'll still display blank in the editor.
		// TODO: We need to iterate so that private videos display as expected.
		return metadata.is_private
			? `https://video.wordpress.com/v/${ guid }`
			: `https://videopress.com/v/${ guid }`;
	}

	render() {
		const { setAttributes, attributes, isSelected, wasBlockJustInserted } = this.props;
		const { id, src, guid } = attributes;
		const { isLoadingMetadata, isUploadInProgress, isUploadFailed, videoContainerHeight } =
			this.state;

		const toolbarEditButton = (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
				isReplacingMedia={ true }
				onSelect={ this.onSelectMediaUploadOption }
				onSelectURL={ this.onSelectURL }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<ToolbarGroup>
							{ getMediaOptions() }
							<ToolbarButton
								label={ __( 'Edit video', 'jetpack' ) }
								icon={ replace }
								onClick={ open }
							/>
						</ToolbarGroup>
					);
				} }
			></MediaUpload>
		);

		const isSourcePresent = src || ( guid && id );
		if ( ! isSourcePresent ) {
			return (
				<View style={ { flex: 1 } }>
					<MediaPlaceholder
						allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
						onSelect={ this.onSelectMediaUploadOption }
						onSelectURL={ this.onSelectURL }
						icon={ this.getIcon( ICON_TYPE.PLACEHOLDER ) }
						onFocus={ this.props.onFocus }
						autoOpenMediaUpload={ isSelected && wasBlockJustInserted }
					/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ this.onVideoPressed }
				disabled={ ! isSelected }
			>
				<View style={ { flex: 1 } }>
					{ ! this.state.isCaptionSelected && <BlockControls>{ toolbarEditButton }</BlockControls> }
					{ isSelected && (
						<InspectorControls>
							<PanelBody title={ __( 'Settings', 'jetpack' ) }>
								<VideoCommonSettings setAttributes={ setAttributes } attributes={ attributes } />
							</PanelBody>
						</InspectorControls>
					) }
					<MediaUploadProgress
						mediaId={ id }
						onFinishMediaUploadWithSuccess={ this.finishMediaUploadWithSuccess }
						onFinishMediaUploadWithFailure={ this.finishMediaUploadWithFailure }
						onUpdateMediaProgress={ this.updateMediaProgress }
						onMediaUploadStateReset={ this.mediaUploadStateReset }
						renderContent={ ( { retryMessage } ) => {
							const videoURL = this.getVideoURL();
							const videoPoster = this.state.metadata.poster;
							const showVideo =
								isURL( videoURL ) &&
								! isUploadInProgress &&
								! isUploadFailed &&
								! isLoadingMetadata;
							const icon = this.getIcon( isUploadFailed ? ICON_TYPE.RETRY : ICON_TYPE.UPLOAD );
							const styleIconContainer = isUploadFailed ? style.modalIconRetry : style.modalIcon;

							const iconContainer = <View style={ styleIconContainer }>{ icon }</View>;

							const videoStyle = {
								height: videoContainerHeight,
								...style.video,
							};

							const containerStyle =
								showVideo && isSelected ? style.containerFocused : style.container;

							return (
								<View onLayout={ this.onVideoContanerLayout } style={ containerStyle }>
									{ showVideo && (
										<View style={ style.videoContainer }>
											<VideoPlayer
												isSelected={ isSelected && ! this.state.isCaptionSelected }
												style={ videoStyle }
												source={ { uri: videoURL } }
												paused={ true }
												poster={ videoPoster }
											/>
										</View>
									) }
									{ ! showVideo && (
										<View
											style={ {
												height: videoContainerHeight,
												width: '100%',
												...this.props.getStylesFromColorScheme(
													style.placeholderContainer,
													style.placeholderContainerDark
												),
											} }
										>
											{ videoContainerHeight > 0 &&
												( isUploadInProgress || isLoadingMetadata ? (
													<ActivityIndicator />
												) : (
													iconContainer
												) ) }
											{ isUploadFailed && (
												<Text style={ style.uploadFailedText }>{ retryMessage }</Text>
											) }
										</View>
									) }
								</View>
							);
						} }
					/>
					<BlockCaption
						accessible={ true }
						accessibilityLabelCreator={ caption =>
							! caption /* translators: accessibility text. Empty video caption. */
								? __( 'Video caption. Empty', 'jetpack' )
								: sprintf(
										/* translators: accessibility text. %s: video caption. */
										__( 'Video caption. %s', 'jetpack' ),
										caption
								  )
						}
						clientId={ this.props.clientId }
						isSelected={ this.state.isCaptionSelected }
						onFocus={ this.onFocusCaption }
						onBlur={ this.props.onBlur } // Always assign onBlur as props.
						insertBlocksAfter={ this.props.insertBlocksAfter }
					/>
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default CoreVideoEdit =>
	compose( [
		withSelect( ( select, { clientId } ) => ( {
			wasBlockJustInserted: select( blockEditorStore ).wasBlockJustInserted(
				clientId,
				'inserter_menu'
			),
		} ) ),
		withDispatch( dispatch => {
			const { createErrorNotice } = dispatch( noticesStore );

			return { createErrorNotice };
		} ),
		withPreferredColorScheme,
		createHigherOrderComponent( WrappedComponent => props => {
			return <WrappedComponent originalEdit={ CoreVideoEdit } { ...props } />;
		} ),
	] )( VideoPressEdit );
