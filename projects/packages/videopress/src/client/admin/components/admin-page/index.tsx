/**
 * External dependencies
 */
import {
	Text,
	AdminPage,
	AdminSectionHero,
	AdminSection,
	Container,
	Button,
	Col,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { FormFileUpload } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import useUploader from '../../../hooks/use-uploader';
import { STORE_ID } from '../../../state';
import { WP_REST_API_MEDIA_ENDPOINT } from '../../../state/constants';
import { mapVideoFromWPV2MediaEndpoint } from '../../../state/utils/map-videos';
import useVideos from '../../hooks/use-videos';
import Logo from '../logo';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';
/**
 * Types
 */
import { ConnectionStore } from './types';

const useDashboardVideos = () => {
	const { setVideo } = useDispatch( STORE_ID );

	const {
		items,
		total: totalVideoCount,
		uploadedVideoCount,
		// isFetching = true,
		// IsFetchingTotalVideosCount = true,
	} = useVideos();

	const poolingUploadedVideoData = async data => {
		setVideo( data );

		const response = await apiFetch( {
			path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ data?.id }` ),
		} );

		const video = mapVideoFromWPV2MediaEndpoint( response );

		if ( video?.finished ) {
			setVideo( video );
		} else {
			setTimeout( () => poolingUploadedVideoData( video ), 1000 );
		}
	};

	const handleSuccess = ( data, file ) => {
		poolingUploadedVideoData( {
			id: data?.id,
			guid: data?.guid,
			url: data?.src,
			title: file?.name,
		} );
	};

	const { handleFilesUpload, status, file } = useUploader( {
		onSuccess: handleSuccess,
	} );

	const videos =
		status === 'uploading'
			? [ { id: null, guid: null, uploading: true, title: file.name }, ...items ]
			: items;

	return {
		videos,
		totalVideoCount,
		uploadedVideoCount,
		uploadStatus: status,
		handleFilesUpload,
	};
};

const Admin = () => {
	const {
		videos,
		totalVideoCount,
		uploadedVideoCount,
		uploadStatus,
		handleFilesUpload,
	} = useDashboardVideos();

	const connectionStatus = useSelect(
		select => ( select( CONNECTION_STORE_ID ) as ConnectionStore ).getConnectionStatus(),
		[]
	);
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const localVideos = [];
	const localTotalVideoCount = 0;
	const hasVideos = uploadedVideoCount > 0 || uploadStatus === 'uploading';
	const hasLocalVideos = localVideos && localVideos.length > 0;
	const addNewLabel = __( 'Add new video', 'jetpack-videopress-pkg' );
	const addFirstLabel = __( 'Add your first video', 'jetpack-videopress-pkg' );
	const addVideoLabel = hasVideos ? addNewLabel : addFirstLabel;

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Logo /> }
		>
			{ showConnectionCard ? (
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				</AdminSectionHero>
			) : (
				<>
					<AdminSectionHero>
						<Container horizontalSpacing={ 6 } horizontalGap={ 3 }>
							<Col sm={ 4 } md={ 4 } lg={ 8 }>
								<Text variant="headline-small" mb={ 3 }>
									{ __( 'High quality, ad-free video', 'jetpack-videopress-pkg' ) }
								</Text>
								<FormFileUpload
									onChange={ evt => handleFilesUpload( evt.currentTarget.files ) }
									accept="video/*"
									render={ ( { openFileDialog } ) => (
										<Button fullWidth={ isSm } onClick={ openFileDialog }>
											{ addVideoLabel }
										</Button>
									) }
								/>
							</Col>
						</Container>
					</AdminSectionHero>
					<AdminSection>
						<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
							{ hasVideos ? (
								<Col sm={ 4 } md={ 6 } lg={ 12 }>
									<VideoPressLibrary videos={ videos } totalVideos={ totalVideoCount } />
								</Col>
							) : (
								<Col sm={ 4 } md={ 6 } lg={ 12 } className={ styles[ 'first-video-wrapper' ] }>
									<Text variant="headline-small">
										{ __( "Let's add your first video", 'jetpack-videopress-pkg' ) }
									</Text>
									<VideoUploadArea
										className={ classnames( styles[ 'upload-area' ], { [ styles.small ]: isSm } ) }
										onSelectFiles={ handleFilesUpload }
									/>
								</Col>
							) }
							{ hasLocalVideos && (
								<Col sm={ 4 } md={ 6 } lg={ 12 }>
									<LocalLibrary videos={ localVideos } totalVideos={ localTotalVideoCount } />
								</Col>
							) }
						</Container>
					</AdminSection>
				</>
			) }
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackVideoPressInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			title={ __( 'High quality, ad-free video.', 'jetpack-videopress-pkg' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-videopress"
			redirectUri="admin.php?page=jetpack-videopress"
		>
			<h3>{ __( 'Connection screen title', 'jetpack-videopress-pkg' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 2', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 3', 'jetpack-videopress-pkg' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
