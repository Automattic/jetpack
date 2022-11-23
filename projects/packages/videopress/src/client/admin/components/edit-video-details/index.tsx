/**
 * External dependencies
 */
import {
	Text,
	Button,
	AdminPage,
	AdminSection,
	Container,
	Col,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRightSmall, arrowLeft } from '@wordpress/icons';
import classnames from 'classnames';
import { useEffect } from 'react';
import { useHistory, Prompt } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { Link } from 'react-router-dom';
import { VideoPlayer } from '../../../components/video-frame-selector';
import { usePermission } from '../../hooks/use-permission';
import useUnloadPrevent from '../../hooks/use-unload-prevent';
import Input from '../input';
import Logo from '../logo';
import Placeholder from '../placeholder';
import VideoDetails from '../video-details';
import VideoThumbnail from '../video-thumbnail';
import VideoThumbnailSelectorModal from '../video-thumbnail-selector-modal';
import styles from './style.module.scss';
import useEditDetails from './use-edit-details';

const noop = () => {
	// noop
};

const Header = ( {
	saveDisabled = true,
	saveLoading = false,
	onSaveChanges,
}: {
	saveDisabled?: boolean;
	saveLoading?: boolean;
	onSaveChanges: () => void;
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const history = useHistory();

	return (
		<div className={ classnames( styles[ 'header-wrapper' ], { [ styles.small ]: isSm } ) }>
			<button onClick={ () => history.push( '/' ) } className={ styles[ 'logo-button' ] }>
				<Logo />
			</button>
			<div className={ styles[ 'header-content' ] }>
				<div className={ styles.breadcrumb }>
					{ ! isSm && <Icon icon={ chevronRightSmall } /> }
					<Text>{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				<div>
					<Button
						disabled={ saveDisabled || saveLoading }
						onClick={ onSaveChanges }
						isLoading={ saveLoading }
					>
						{ __( 'Save changes', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

const GoBackLink = () => {
	const history = useHistory();

	return (
		<div className={ styles[ 'back-link' ] }>
			<Link to="#" className={ styles.link } onClick={ () => history.push( '/' ) }>
				<Icon icon={ arrowLeft } className={ styles.icon } />
				{ __( 'Go back', 'jetpack-videopress-pkg' ) }
			</Link>
		</div>
	);
};

const Infos = ( {
	title,
	onChangeTitle,
	description,
	onChangeDescription,
	caption,
	onChangeCaption,
	loading,
}: {
	title: string;
	onChangeTitle: ( value: string ) => void;
	description: string;
	onChangeDescription: ( value: string ) => void;
	caption: string;
	onChangeCaption: ( value: string ) => void;
	loading: boolean;
} ) => {
	return (
		<>
			{ loading ? (
				<Placeholder height={ 88 } />
			) : (
				<Input
					value={ title }
					label={ __( 'Title', 'jetpack-videopress-pkg' ) }
					name="title"
					onChange={ onChangeTitle }
					onEnter={ noop }
					size="large"
				/>
			) }
			{ loading ? (
				<Placeholder height={ 133 } className={ styles.input } />
			) : (
				<Input
					value={ description }
					className={ styles.input }
					label={ __( 'Description', 'jetpack-videopress-pkg' ) }
					name="description"
					onChange={ onChangeDescription }
					onEnter={ noop }
					type="textarea"
					size="large"
				/>
			) }
			{ loading ? (
				<Placeholder height={ 133 } className={ styles.input } />
			) : (
				<Input
					value={ caption }
					className={ styles.input }
					label={ __( 'Caption', 'jetpack-videopress-pkg' ) }
					name="caption"
					onChange={ onChangeCaption }
					onEnter={ noop }
					type="textarea"
					size="large"
				/>
			) }
		</>
	);
};

const EditVideoDetails = () => {
	const {
		// Video Data
		duration,
		posterImage,
		filename,
		uploadDate,
		url,
		title,
		description,
		caption,
		// Playback Token
		isFetchingPlaybackToken,
		// Page State/Actions
		hasChanges,
		updating,
		updated,
		isFetching,
		handleSaveChanges,
		// Metadata
		setTitle,
		setDescription,
		setCaption,
		processing,
		// Poster Image
		useVideoAsThumbnail,
		selectedTime,
		handleConfirmFrame,
		handleCloseSelectFrame,
		handleOpenSelectFrame,
		handleVideoFrameSelected,
		frameSelectorIsOpen,
		selectPosterImageFromLibrary,
		posterImageSource,
		libraryAttachment,
	} = useEditDetails();

	const { canPerformAction } = usePermission();

	const unsavedChangesMessage = __(
		'There are unsaved changes. Are you sure you want to exit?',
		'jetpack-videopress-pkg'
	);

	useUnloadPrevent( {
		shouldPrevent: hasChanges && ! updated && canPerformAction,
		message: unsavedChangesMessage,
	} );

	const history = useHistory();

	useEffect( () => {
		if ( updated === true ) {
			history.push( '/' );
		}
	}, [ updated ] );

	if ( ! canPerformAction ) {
		history.push( '/' );
	}

	let thumbnail: string | JSX.Element = posterImage;

	if ( posterImageSource === 'video' && useVideoAsThumbnail ) {
		thumbnail = <VideoPlayer src={ url } currentTime={ selectedTime } />;
	} else if ( posterImageSource === 'upload' ) {
		thumbnail = libraryAttachment.url;
	}

	const isFetchingData = isFetching || isFetchingPlaybackToken;

	return (
		<>
			<Prompt when={ hasChanges && ! updated } message={ unsavedChangesMessage } />

			{ frameSelectorIsOpen && (
				<VideoThumbnailSelectorModal
					handleCloseSelectFrame={ handleCloseSelectFrame }
					url={ url }
					handleVideoFrameSelected={ handleVideoFrameSelected }
					selectedTime={ selectedTime }
					handleConfirmFrame={ handleConfirmFrame }
				/>
			) }

			<AdminPage
				moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
				header={
					<>
						<GoBackLink />
						<Header
							onSaveChanges={ handleSaveChanges }
							saveDisabled={ ! hasChanges }
							saveLoading={ updating }
						/>
					</>
				}
			>
				<AdminSection>
					<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
						<Col sm={ 4 } md={ 8 } lg={ 7 }>
							<Infos
								title={ title ?? '' }
								onChangeTitle={ setTitle }
								description={ description ?? '' }
								onChangeDescription={ setDescription }
								caption={ caption ?? '' }
								onChangeCaption={ setCaption }
								loading={ isFetchingData }
							/>
						</Col>
						<Col sm={ 4 } md={ 8 } lg={ { start: 9, end: 12 } }>
							<VideoThumbnail
								thumbnail={ isFetchingData ? <Placeholder height={ 200 } /> : thumbnail }
								duration={ duration }
								editable
								processing={ processing }
								onSelectFromVideo={ handleOpenSelectFrame }
								onUploadImage={ selectPosterImageFromLibrary }
							/>
							<VideoDetails
								filename={ filename ?? '' }
								uploadDate={ uploadDate ?? '' }
								src={ url ?? '' }
								loading={ isFetchingData }
							/>
						</Col>
					</Container>
				</AdminSection>
			</AdminPage>
		</>
	);
};

export default EditVideoDetails;
