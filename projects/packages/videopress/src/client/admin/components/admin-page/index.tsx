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
import {
	useProductCheckoutWorkflow,
	useConnection,
	useConnectionErrorNotice,
	ConnectionError,
	ConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { FormFileUpload } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import uid from '../../../utils/uid';
import { fileInputExtensions } from '../../../utils/video-extensions';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { usePlan } from '../../hooks/use-plan';
import useVideos, { useLocalVideos } from '../../hooks/use-videos';
import { NeedUserConnectionGlobalNotice } from '../global-notice';
import Logo from '../logo';
import PricingSection from '../pricing-section';
import { ConnectVideoStorageMeter } from '../video-storage-meter';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';

const useDashboardVideos = () => {
	const { uploadVideo, uploadVideoFromLibrary } = useDispatch( STORE_ID );

	const { items, uploading, uploadedVideoCount, isFetching, search, page } = useVideos();
	const { items: localVideos, uploadedLocalVideoCount } = useLocalVideos();

	// Do not show uploading videos if not in the first page or searching
	let videos = page > 1 || Boolean( search ) ? items : [ ...uploading, ...items ];

	const hasVideos = uploadedVideoCount > 0 || isFetching || uploading?.length > 0;
	const hasLocalVideos = uploadedLocalVideoCount > 0;

	const handleFilesUpload = ( files: FileList | File[] ) => {
		const file = files instanceof FileList || Array.isArray( files ) ? files[ 0 ] : files; // @todo support multiple files upload
		uploadVideo( file );
	};

	const handleLocalVideoUpload = file => {
		uploadVideoFromLibrary( file );
	};

	// Fill with empty videos if loading
	if ( isFetching ) {
		// Use generated ID to work with React Key
		videos = new Array( 6 ).fill( {} ).map( () => ( { id: uid() } ) );
	}

	return {
		videos,
		localVideos,
		uploadedVideoCount,
		uploadedLocalVideoCount,
		hasVideos,
		hasLocalVideos,
		handleFilesUpload,
		handleLocalVideoUpload,
		loading: isFetching,
		uploading: uploading?.length > 0,
	};
};

const Admin = () => {
	const {
		videos,
		uploadedVideoCount,
		localVideos,
		uploadedLocalVideoCount,
		hasVideos,
		hasLocalVideos,
		handleFilesUpload,
		handleLocalVideoUpload,
		loading,
		uploading,
	} = useDashboardVideos();

	const { hasVideoPressPurchase } = usePlan();

	const { isRegistered, hasConnectedOwner } = useConnection();
	const { hasConnectionError } = useConnectionErrorNotice();

	const [ showPricingSection, setShowPricingSection ] = useState( ! isRegistered );

	const [ isSm ] = useBreakpointMatch( 'sm' );

	const addNewLabel = __( 'Add new video', 'jetpack-videopress-pkg' );
	const addFirstLabel = __( 'Add your first video', 'jetpack-videopress-pkg' );
	const addVideoLabel = hasVideos ? addNewLabel : addFirstLabel;

	useAnalyticsTracks( { pageViewEventName: 'admin' } );

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Logo /> }
		>
			{ showPricingSection ? (
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<PricingSection onRedirecting={ () => setShowPricingSection( true ) } />
						</Col>
					</Container>
				</AdminSectionHero>
			) : (
				<>
					<AdminSectionHero>
						<Container horizontalSpacing={ 6 } horizontalGap={ 3 }>
							{ hasConnectionError && (
								<Col>
									<ConnectionError />
								</Col>
							) }

							{ ! hasConnectedOwner ? (
								<Col sm={ 4 } md={ 8 } lg={ 12 }>
									<NeedUserConnectionGlobalNotice />
								</Col>
							) : (
								<ConnectionErrorNotice />
							) }
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
									accept={ fileInputExtensions }
									render={ ( { openFileDialog } ) => (
										<Button
											fullWidth={ isSm }
											onClick={ openFileDialog }
											isLoading={ loading }
											disabled={ ! hasVideoPressPurchase && hasVideos }
										>
											{ addVideoLabel }
										</Button>
									) }
								/>

								{ ! hasVideoPressPurchase && <UpgradeTrigger hasUsedVideo={ hasVideos } /> }
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
									<LocalLibrary
										videos={ localVideos }
										totalVideos={ uploadedLocalVideoCount }
										onUploadClick={ handleLocalVideoUpload }
										uploading={ uploading }
									/>
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

const UpgradeTrigger = ( { hasUsedVideo = false }: { hasUsedVideo: boolean } ) => {
	const { adminUrl, siteSuffix } = window.jetpackVideoPressInitialState;

	const { product, hasVideoPressPurchase, isFetchingPurchases } = usePlan();
	const { run } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: product.productSlug,
		redirectUrl: adminUrl,
		isFetchingPurchases,
	} );

	const { recordEventHandler } = useAnalyticsTracks( {} );
	const onButtonClickHandler = recordEventHandler(
		'jetpack_videopress_upgrade_trigger_link_click',
		run
	);

	const description = hasUsedVideo
		? __( 'You have used your free video upload', 'jetpack-videopress-pkg' )
		: '';

	const cta = __(
		'Upgrade now to unlock unlimited videos, 1TB of storage, and more!',
		'jetpack-videopress-pkg'
	);

	if ( hasVideoPressPurchase || isFetchingPurchases ) {
		return null;
	}

	return (
		<ContextualUpgradeTrigger
			description={ description }
			cta={ cta }
			className={ styles[ 'upgrade-trigger' ] }
			onClick={ onButtonClickHandler }
		/>
	);
};
