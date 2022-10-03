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
	ThemeProvider,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRightSmall } from '@wordpress/icons';
import classnames from 'classnames';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import VideoFrameSelector, { VideoPlayer } from '../../../components/video-frame-selector';
import Input from '../input';
import Logo from '../logo';
import Placeholder from '../placeholder';
import VideoDetails from '../video-details';
import VideoThumbnail from '../video-thumbnail';
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
	const navigate = useNavigate();

	return (
		<div className={ classnames( styles[ 'header-wrapper' ], { [ styles.small ]: isSm } ) }>
			<button onClick={ () => navigate( '/' ) } className={ styles[ 'logo-button' ] }>
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
	const [ modalRef, setModalRef ] = useState< HTMLDivElement | null >( null );
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
	} = useEditDetails();

	const thumbnail = useVideoAsThumbnail ? (
		<VideoPlayer src={ url } currentTime={ selectedTime } />
	) : (
		posterImage
	);

	return (
		<>
			{ frameSelectorIsOpen && (
				<Modal
					title={ __( 'Select thumbnail from video', 'jetpack-videopress-pkg' ) }
					onRequestClose={ handleCloseSelectFrame }
					isDismissible={ false }
				>
					<ThemeProvider targetDom={ modalRef }>
						<div ref={ setModalRef } className={ styles.selector }>
							<VideoFrameSelector
								src={ url }
								onVideoFrameSelected={ handleVideoFrameSelected }
								initialCurrentTime={ selectedTime }
							/>
							<div className={ styles.actions }>
								<Button variant="secondary" onClick={ handleCloseSelectFrame }>
									{ __( 'Close', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button variant="primary" onClick={ handleConfirmFrame }>
									{ __( 'Select this frame', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						</div>
					</ThemeProvider>
				</Modal>
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
