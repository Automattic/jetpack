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
	ContextualUpgradeTrigger,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow, useConnection } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { FormFileUpload } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
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
import { usePlan } from '../../hooks/use-plan';
import useVideos from '../../hooks/use-videos';
import Logo from '../logo';
import PricingSection from '../pricing-section';
import { ConnectVideoStorageMeter } from '../video-storage-meter';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';

const useDashboardVideos = () => {
	const { setVideo } = useDispatch( STORE_ID );

	const { items, total: totalVideoCount, uploadedVideoCount, isFetching } = useVideos();

	const loading = isFetching;

	const poolingUploadedVideoData = async data => {
		setVideo( data );

		const response = await apiFetch( {
			path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ data?.id }` ),
		} );

		const video = mapVideoFromWPV2MediaEndpoint( response );

		if ( video?.posterImage !== null ) {
			setVideo( video );
		} else {
			setTimeout( () => poolingUploadedVideoData( video ), 2000 );
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

	let videos =
		status === 'uploading'
			? [ { id: null, guid: null, uploading: true, title: file.name }, ...items ]
			: items;

	// Fill with empty videos if loading
	if ( loading ) {
		videos = new Array( 6 ).fill( {} );
	}

	return {
		videos,
		totalVideoCount,
		uploadedVideoCount,
		uploadStatus: status,
		handleFilesUpload,
		loading,
	};
};

const Admin = () => {
	const {
		videos,
		uploadedVideoCount,
		uploadStatus,
		handleFilesUpload,
		loading,
	} = useDashboardVideos();

	const { isUserConnected, isRegistered } = useConnection();

	const [ isSm ] = useBreakpointMatch( 'sm' );
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const localVideos = [];
	const localTotalVideoCount = 0;
	const hasVideos = uploadedVideoCount > 0 || uploadStatus === 'uploading' || loading;
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
							<PricingSection />
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

								<ConnectVideoStorageMeter
									className={ styles[ 'storage-meter' ] }
									progressBarClassName={ styles[ 'storage-meter__progress-bar' ] }
								/>

								<FormFileUpload
									onChange={ evt => handleFilesUpload( evt.currentTarget.files ) }
									accept="video/*"
									render={ ( { openFileDialog } ) => (
										<Button fullWidth={ isSm } onClick={ openFileDialog } isLoading={ loading }>
											{ addVideoLabel }
										</Button>
									) }
								/>
								<UpgradeTrigger />
							</Col>
						</Container>
					</AdminSectionHero>
					<AdminSection>
						<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
							{ hasVideos ? (
								<Col sm={ 4 } md={ 6 } lg={ 12 }>
									<VideoPressLibrary
										videos={ videos }
										totalVideos={ uploadedVideoCount }
										loading={ loading }
									/>
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

const UpgradeTrigger = () => {
	const {
		paidFeatures: { isVideoPress1TBSupported, isVideoPressUnlimitedSupported },
		adminUrl,
		siteSuffix,
	} = window.jetpackVideoPressInitialState;

	const { product } = usePlan();

	const { run } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: product.productSlug,
		redirectUrl: adminUrl,
	} );

	if ( isVideoPress1TBSupported || isVideoPressUnlimitedSupported ) {
		return null;
	}

	// TODO: use count from initial state
	const { uploadedVideoCount } = useVideos();
	const hasUploadedVideo = uploadedVideoCount > 0;
	const isUploading = false;

	const description =
		hasUploadedVideo || isUploading
			? __( 'You have used your free video upload', 'jetpack-videopress-pkg' )
			: '';
	const cta = __(
		'Upgrade now to unlock unlimited videos, 1TB of storage, and more!',
		'jetpack-videopress-pkg'
	);

	return (
		<ContextualUpgradeTrigger
			description={ description }
			cta={ cta }
			className={ styles[ 'upgrade-trigger' ] }
			onClick={ run }
		/>
	);
};
