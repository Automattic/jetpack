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
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRightSmall } from '@wordpress/icons';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import Input from '../input';
import Logo from '../logo';
import VideoDetails from '../video-details';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';
import useEditDetails from './use-edit-details';

const noop = () => {
	// noop
};

const Header = ( {
	saveDisabled = true,
	onSaveChanges,
}: {
	saveDisabled?: boolean;
	onSaveChanges: () => void;
} ) => {
	const navigate = useNavigate();
	return (
		<div className={ styles.header }>
			<div className={ styles.breadcrumb }>
				<button onClick={ () => navigate( '/' ) } className={ styles[ 'logo-button' ] }>
					<Logo />
				</button>
				<Icon icon={ chevronRightSmall } />
				<Text>{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }</Text>
			</div>
			<Button disabled={ saveDisabled } onClick={ onSaveChanges }>
				{ __( 'Save changes', 'jetpack-videopress-pkg' ) }
			</Button>
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
}: {
	title: string;
	onChangeTitle: ( value: string ) => void;
	description: string;
	onChangeDescription: ( value: string ) => void;
	caption: string;
	onChangeCaption: ( value: string ) => void;
} ) => {
	return (
		<>
			<Input
				value={ title }
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
				name="title"
				onChange={ onChangeTitle }
				onEnter={ noop }
				size="large"
			/>
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
		</>
	);
};

const EditVideoDetails = () => {
	const {
		duration,
		posterImage,
		filename,
		uploadDate,
		url,
		title,
		setTitle,
		description,
		setDescription,
		caption,
		setCaption,
		saveDisabled,
		handleSaveChanges,
	} = useEditDetails();

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Header onSaveChanges={ handleSaveChanges } saveDisabled={ saveDisabled } /> }
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
						/>
					</Col>
					<Col sm={ 4 } md={ 8 } lg={ { start: 9, end: 12 } }>
						<VideoThumbnail thumbnail={ posterImage } duration={ duration } editable />
						<VideoDetails
							filename={ filename ?? '' }
							uploadDate={ uploadDate ?? '' }
							src={ url ?? '' }
						/>
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default EditVideoDetails;
