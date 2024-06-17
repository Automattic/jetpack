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
	JetpackVideoPressLogo,
	LoadingPlaceholder,
} from '@automattic/jetpack-components';
import { SelectControl, RadioControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	chevronRightSmall,
	arrowLeft,
	globe as siteDefaultPrivacyIcon,
} from '@wordpress/icons';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useHistory, Prompt } from 'react-router-dom';
import { Link } from 'react-router-dom';
/**
 * Internal dependencies
 */
import ChaptersLearnMoreHelper from '../../../components/chapters-learn-more-helper';
import privatePrivacyIcon from '../../../components/icons/crossed-eye-icon';
import publicPrivacyIcon from '../../../components/icons/uncrossed-eye-icon';
import IncompleteChaptersNotice from '../../../components/incomplete-chapters-notice';
import { VideoPlayer } from '../../../components/video-frame-selector';
import useChaptersLiveParsing from '../../../hooks/use-chapters-live-parsing';
import {
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
	VIDEO_RATING_G,
	VIDEO_RATING_PG_13,
	VIDEO_RATING_R_17,
} from '../../../state/constants';
import { usePermission } from '../../hooks/use-permission';
import useUnloadPrevent from '../../hooks/use-unload-prevent';
import { useVideosQuery } from '../../hooks/use-videos';
import Input from '../input';
import VideoDetails from '../video-details';
import VideoDetailsActions from '../video-details-actions';
import VideoThumbnail from '../video-thumbnail';
import VideoThumbnailSelectorModal from '../video-thumbnail-selector-modal';
import styles from './style.module.scss';
import useEditDetails from './use-edit-details';

const noop = () => {
	// noop
};

const Header = ( {
	saveDisabled = true,
	disabled = false,
	onSaveChanges,
	onDelete,
	videoId,
}: {
	saveDisabled?: boolean;
	disabled?: boolean;
	onSaveChanges: () => void;
	onDelete: () => void;
	videoId: string | number;
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const history = useHistory();

	return (
		<div className={ clsx( styles[ 'header-wrapper' ], { [ styles.small ]: isSm } ) }>
			<button onClick={ () => history.push( '/' ) } className={ styles[ 'logo-button' ] }>
				<JetpackVideoPressLogo />
			</button>
			<div className={ styles[ 'header-content' ] }>
				<div className={ styles.breadcrumb }>
					{ ! isSm && <Icon icon={ chevronRightSmall } /> }
					<Text>{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }</Text>
				</div>
				<div className={ styles.buttons }>
					<Button
						disabled={ saveDisabled || disabled }
						onClick={ onSaveChanges }
						isLoading={ disabled }
					>
						{ __( 'Save changes', 'jetpack-videopress-pkg' ) }
					</Button>
					<VideoDetailsActions videoId={ videoId } disabled={ disabled } onDelete={ onDelete } />
				</div>
			</div>
		</div>
	);
};

const GoBackLink = () => {
	const { page } = useVideosQuery();
	const to = page > 1 ? `/?page=${ page }` : '/';

	return (
		<div className={ styles[ 'back-link' ] }>
			<Link to={ to } className={ styles.link }>
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
	loading = false,
	disabled = false,
}: {
	title: string;
	onChangeTitle: ( value: string ) => void;
	description: string;
	onChangeDescription: ( value: string ) => void;
	loading: boolean;
	disabled: boolean;
} ) => {
	const { hasIncompleteChapters } = useChaptersLiveParsing( description );

	return (
		<>
			{ loading ? (
				<LoadingPlaceholder height={ 88 } />
			) : (
				<Input
					value={ title }
					label={ __( 'Title', 'jetpack-videopress-pkg' ) }
					name="title"
					onChange={ onChangeTitle }
					onEnter={ noop }
					disabled={ disabled }
					size="large"
				/>
			) }
			{ loading ? (
				<LoadingPlaceholder height={ 133 } className={ styles.input } />
			) : (
				<>
					<Input
						value={ description }
						className={ styles.input }
						label={ __( 'Description', 'jetpack-videopress-pkg' ) }
						name="description"
						onChange={ onChangeDescription }
						onEnter={ noop }
						disabled={ disabled }
						type="textarea"
						size="large"
						rows={ 8 }
					/>
					<div className={ styles[ 'chapters-help-container' ] }>
						{ hasIncompleteChapters ? (
							<IncompleteChaptersNotice className={ styles[ 'incomplete-chapters-notice' ] } />
						) : (
							<div className={ styles[ 'learn-more' ] }>
								<ChaptersLearnMoreHelper />
							</div>
						) }
					</div>
				</>
			) }
		</>
	);
};

const EditVideoDetails = () => {
	const {
		// Video Data
		guid,
		id,
		duration,
		posterImage,
		filename,
		uploadDate,
		url,
		width,
		height,
		title,
		description,
		rating,
		privacySetting,
		allowDownload,
		displayEmbed,
		isPrivate,
		// Playback Token
		isFetchingPlaybackToken,
		// Page State/Actions
		hasChanges,
		updating,
		updated,
		deleted,
		isFetching,
		isDeleting,
		handleSaveChanges,
		handleDelete,
		// Metadata
		setTitle,
		setDescription,
		setRating,
		setPrivacySetting,
		setAllowDownload,
		setDisplayEmbed,
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
		shouldPrevent: hasChanges && ! updated && ! deleted && canPerformAction,
		message: unsavedChangesMessage,
	} );

	const history = useHistory();
	const { page } = useVideosQuery();

	useEffect( () => {
		if ( deleted === true ) {
			const to = page > 1 ? `/?page=${ page }` : '/';
			history.push( to );
		}
	}, [ deleted ] );

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
	const isBusy = isDeleting || updating;

	const shortcode = `[videopress ${ guid }${ width ? ` w=${ width }` : '' }${
		height ? ` h=${ height }` : ''
	}]`;

	return (
		<>
			<Prompt when={ hasChanges && ! updated && ! deleted } message={ unsavedChangesMessage } />

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
						<div id="jp-admin-notices" className={ styles[ 'jetpack-videopress-jitm-card' ] } />
						<GoBackLink />
						<Header
							onSaveChanges={ handleSaveChanges }
							onDelete={ handleDelete }
							saveDisabled={ ! hasChanges }
							disabled={ isBusy || isFetchingData }
							videoId={ id }
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
								loading={ isFetchingData }
								disabled={ isBusy }
							/>
						</Col>
						<Col sm={ 4 } md={ 8 } lg={ { start: 9, end: 12 } }>
							<VideoThumbnail
								thumbnail={ thumbnail }
								loading={ isFetchingData }
								processing={ processing }
								deleting={ isDeleting }
								updating={ updating }
								duration={ duration }
								editable
								onSelectFromVideo={ handleOpenSelectFrame }
								onUploadImage={ selectPosterImageFromLibrary }
							/>
							<VideoDetails
								filename={ filename ?? '' }
								uploadDate={ uploadDate ?? '' }
								shortcode={ shortcode ?? '' }
								loading={ isFetchingData }
								guid={ guid }
								isPrivate={ isPrivate }
							/>
							<div className={ styles[ 'side-fields' ] }>
								{ isFetchingData ? (
									<LoadingPlaceholder height={ 40 } className={ clsx( styles.field ) } />
								) : (
									<SelectControl
										className={ styles.field }
										value={ privacySetting }
										label={ __( 'Privacy', 'jetpack-videopress-pkg' ) }
										onChange={ value => setPrivacySetting( value ) }
										disabled={ isBusy }
										prefix={
											// Casting for unknown since allowing only a string is a mistake
											// at WP Components
											(
												<div className={ styles[ 'privacy-icon' ] }>
													<Icon
														icon={
															( privacySetting === VIDEO_PRIVACY_LEVEL_PUBLIC &&
																publicPrivacyIcon ) ||
															( privacySetting === VIDEO_PRIVACY_LEVEL_PRIVATE &&
																privatePrivacyIcon ) ||
															( privacySetting === VIDEO_PRIVACY_LEVEL_SITE_DEFAULT &&
																siteDefaultPrivacyIcon )
														}
													/>
												</div>
											 ) as unknown as string
										}
										options={ [
											{
												label: __( 'Site default', 'jetpack-videopress-pkg' ),
												value: VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
											},
											{
												label: __( 'Public', 'jetpack-videopress-pkg' ),
												value: VIDEO_PRIVACY_LEVEL_PUBLIC,
											},
											{
												label: __( 'Private', 'jetpack-videopress-pkg' ),
												value: VIDEO_PRIVACY_LEVEL_PRIVATE,
											},
										] }
									/>
								) }
								{ isFetchingData ? (
									<LoadingPlaceholder height={ 40 } className={ clsx( styles.field ) } />
								) : (
									<>
										<Text className={ clsx( styles.field, styles.checkboxTitle ) }>
											{ __( 'Share', 'jetpack-videopress-pkg' ) }
										</Text>
										<CheckboxControl
											checked={ displayEmbed }
											disabled={ isBusy }
											label={ __(
												'Display share menu and allow viewers to copy a link or embed this video',
												'jetpack-videopress-pkg'
											) }
											onChange={ value => setDisplayEmbed( value ? 1 : 0 ) }
										/>
									</>
								) }
								{ isFetchingData ? (
									<LoadingPlaceholder height={ 40 } className={ clsx( styles.field ) } />
								) : (
									<>
										<Text className={ clsx( styles.field, styles.checkboxTitle ) }>
											{ __( 'Download', 'jetpack-videopress-pkg' ) }
										</Text>
										<CheckboxControl
											checked={ allowDownload }
											disabled={ isBusy }
											label={ __(
												'Display download option and allow viewers to download this video',
												'jetpack-videopress-pkg'
											) }
											onChange={ value => setAllowDownload( value ? 1 : 0 ) }
										/>
									</>
								) }
								{ isBusy || isFetchingData ? (
									// RadioControl does not support disabled state
									<LoadingPlaceholder height={ 40 } className={ clsx( styles.field ) } />
								) : (
									<RadioControl
										className={ clsx( styles.field, styles.rating ) }
										label={ __( 'Rating', 'jetpack-videopress-pkg' ) }
										selected={ rating }
										options={ [
											{ label: __( 'G', 'jetpack-videopress-pkg' ), value: VIDEO_RATING_G },
											{ label: __( 'PG-13', 'jetpack-videopress-pkg' ), value: VIDEO_RATING_PG_13 },
											{ label: __( 'R', 'jetpack-videopress-pkg' ), value: VIDEO_RATING_R_17 },
										] }
										onChange={ setRating }
									/>
								) }
							</div>
						</Col>
					</Container>
				</AdminSection>
			</AdminPage>
		</>
	);
};

export default EditVideoDetails;
