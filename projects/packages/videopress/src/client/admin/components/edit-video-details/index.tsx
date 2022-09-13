import {
	Text,
	Button,
	AdminPage,
	AdminSection,
	Container,
	Col,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRightSmall } from '@wordpress/icons';
import { useParams } from 'react-router-dom';
import { STORE_ID } from '../../../state';
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

const Infos = () => {
	return (
		<>
			<Input label="Title" name="title" onChange={ noop } onEnter={ noop } size="large" />
			<Input
				className={ styles.input }
				label="Description"
				name="description"
				onChange={ noop }
				onEnter={ noop }
				type="textarea"
				size="large"
			/>
			<Input
				className={ styles.input }
				label="Caption"
				name="caption"
				onChange={ noop }
				onEnter={ noop }
				type="textarea"
				size="large"
			/>
		</>
	);
};

const EditVideoDetails = () => {
	const { videoId } = useParams();

	const video = useSelect( select => select( STORE_ID ).getVideo( Number( videoId ) ), [
		videoId,
	] );

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Header /> }
		>
			<AdminSection>
				<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
					<Col sm={ 4 } md={ 8 } lg={ 7 }>
						<Infos />
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
