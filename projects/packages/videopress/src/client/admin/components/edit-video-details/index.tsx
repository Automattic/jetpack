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
// import { useParams } from 'react-router-dom';
import * as mock from '../../mock';
import Input from '../input';
import Logo from '../logo';
import { VideoThumbnail } from '../video-card';
import VideoDetails from '../video-details';
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

const Infos = () => {
	return (
		<>
			<Input label="Title" name="title" onChange={ noop } onEnter={ noop } />
			<Input
				label="Description"
				name="description"
				onChange={ noop }
				onEnter={ noop }
				type="textarea"
			/>
			<Input label="Caption" name="caption" onChange={ noop } onEnter={ noop } type="textarea" />
		</>
	);
};

const EditVideoDetails = () => {
	const video = mock.videos[ 0 ];

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Header /> }
		>
			<AdminSection>
				<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
					<Col sm={ 4 } md={ 6 } lg={ 7 }>
						<Infos />
					</Col>
					<Col sm={ 4 } md={ 6 } lg={ 5 }>
						<VideoThumbnail thumbnail={ video?.posterImage } duration={ video?.duration } />
						<VideoDetails
							filename={ video?.videoTitle }
							uploadDate={ video?.uploadDate }
							src="https://jetpack.com"
						/>
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default EditVideoDetails;
