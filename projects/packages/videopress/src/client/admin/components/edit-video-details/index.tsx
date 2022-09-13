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
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useVideo from '../../hooks/use-video';
import Input from '../input';
import Logo from '../logo';
import VideoDetails from '../video-details';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';

const noop = () => {
	// noop
};

const Header = ( { saveDisabled = true }: { saveDisabled?: boolean } ) => {
	return (
		<div className={ styles.header }>
			<div className={ styles.breadcrumb }>
				<Logo />
				<Icon icon={ chevronRightSmall } />
				<Text>{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }</Text>
			</div>
			<Button disabled={ saveDisabled }>{ __( 'Save changes', 'jetpack-videopress-pkg' ) }</Button>
		</div>
	);
};

const Infos = ( { video } ) => {
	const [ title, setTitle ] = useState( video?.title );
	const [ description, setDescription ] = useState( video?.description );
	const [ caption, setCaption ] = useState( video?.caption );

	useEffect( () => {
		setTitle( video?.title );
		setDescription( video?.description );
		setCaption( video?.caption );
	}, [ video ] );

	return (
		<>
			<Input
				value={ title }
				label="Title"
				name="title"
				onChange={ setTitle }
				onEnter={ noop }
				size="large"
			/>
			<Input
				value={ description }
				className={ styles.input }
				label="Description"
				name="description"
				onChange={ setDescription }
				onEnter={ noop }
				type="textarea"
				size="large"
			/>
			<Input
				value={ caption }
				className={ styles.input }
				label="Caption"
				name="caption"
				onChange={ setCaption }
				onEnter={ noop }
				type="textarea"
				size="large"
			/>
		</>
	);
};

const EditVideoDetails = () => {
	const { videoId } = useParams();
	const video = useVideo( Number( videoId ) );

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Header /> }
		>
			<AdminSection>
				<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
					<Col sm={ 4 } md={ 8 } lg={ 7 }>
						<Infos video={ video } />
					</Col>
					<Col sm={ 4 } md={ 8 } lg={ { start: 9, end: 12 } }>
						<VideoThumbnail
							thumbnail={ video?.posterImage }
							duration={ video?.duration }
							editable
						/>
						<VideoDetails
							filename={ video?.filename }
							uploadDate={ video?.uploadDate }
							src={ video?.url }
						/>
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default EditVideoDetails;
