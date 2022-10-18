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
import { Icon, chevronRightSmall } from '@wordpress/icons';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
/**
 * Internal dependencies
 */
import { VideoPlayer } from '../../../components/video-frame-selector';
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
		// Page State/Actions
		saveDisabled,
		updating,
		isFetching,
		handleSaveChanges,
		// Metadata
		setTitle,
		setDescription,
		setCaption,
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

	let thumbnail: string | JSX.Element = posterImage;
	if ( posterImageSource === 'video' && useVideoAsThumbnail ) {
		thumbnail = <VideoPlayer src={ url } currentTime={ selectedTime } />;
	} else if ( posterImageSource === 'upload' ) {
		thumbnail = libraryAttachment.url;
	}

	return (
		<>
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
					<Header
						onSaveChanges={ handleSaveChanges }
						saveDisabled={ saveDisabled }
						saveLoading={ updating }
					/>
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
								loading={ isFetching }
							/>
						</Col>
						<Col sm={ 4 } md={ 8 } lg={ { start: 9, end: 12 } }>
							<VideoThumbnail
								thumbnail={ isFetching ? <Placeholder height={ 200 } /> : thumbnail }
								duration={ duration }
								editable
								onSelectFromVideo={ handleOpenSelectFrame }
								onUploadImage={ selectPosterImageFromLibrary }
							/>
							<VideoDetails
								filename={ filename ?? '' }
								uploadDate={ uploadDate ?? '' }
								src={ url ?? '' }
								loading={ isFetching }
							/>
						</Col>
					</Container>
				</AdminSection>
			</AdminPage>
		</>
	);
};

export default EditVideoDetails;
