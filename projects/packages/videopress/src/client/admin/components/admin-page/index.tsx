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
} from '@automattic/jetpack-connection';
import { FormFileUpload } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { usePlan } from '../../hooks/use-plan';
import useVideos from '../../hooks/use-videos';
import Logo from '../logo';
import PricingSection from '../pricing-section';
import { ConnectVideoStorageMeter } from '../video-storage-meter';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';

const useDashboardVideos = () => {
	const { uploadVideo } = useDispatch( STORE_ID );

	const { items, uploading, uploadedVideoCount, isFetching } = useVideos();

	let videos = [ ...uploading, ...items ];

	const hasVideos = uploadedVideoCount > 0 || isFetching || uploading?.length > 0;
	const localVideos = [];
	const localTotalVideoCount = 0;
	const hasLocalVideos = localVideos && localVideos.length > 0;

	const handleFilesUpload = ( files: FileList | File[] ) => {
		const file = files instanceof FileList || Array.isArray( files ) ? files[ 0 ] : files; // @todo support multiple files upload
		uploadVideo( file );
	};

	// Fill with empty videos if loading
	if ( isFetching ) {
		videos = new Array( 6 ).fill( {} );
	}

	return {
		videos,
		localVideos,
		uploadedVideoCount,
		localTotalVideoCount,
		hasVideos,
		hasLocalVideos,
		handleFilesUpload,
		loading: isFetching,
	};
};

const Admin = () => {
	const {
		videos,
		localVideos,
		uploadedVideoCount,
		localTotalVideoCount,
		hasVideos,
		hasLocalVideos,
		handleFilesUpload,
		loading,
	} = useDashboardVideos();

	const {
		paidFeatures: { isVideoPress1TBSupported, isVideoPressUnlimitedSupported },
	} = window.jetpackVideoPressInitialState;

	const hasPaidPlan = isVideoPress1TBSupported || isVideoPressUnlimitedSupported;

	const { isUserConnected, isRegistered } = useConnection();
	const { hasConnectionError } = useConnectionErrorNotice();

	const [ isSm ] = useBreakpointMatch( 'sm' );
	const showConnectionCard = ! isRegistered || ! isUserConnected;

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
							{ hasConnectionError && (
								<Col>
									<ConnectionError />
								</Col>
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
									accept="video/*"
									render={ ( { openFileDialog } ) => (
										<Button
											fullWidth={ isSm }
											onClick={ openFileDialog }
											isLoading={ loading }
											disabled={ ! hasPaidPlan && hasVideos }
										>
											{ addVideoLabel }
										</Button>
									) }
								/>

								{ ! hasPaidPlan && <UpgradeTrigger hasUsedVideo={ hasVideos } /> }
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

const UpgradeTrigger = ( { hasUsedVideo = false }: { hasUsedVideo: boolean } ) => {
	const { adminUrl, siteSuffix } = window.jetpackVideoPressInitialState;

	const { product, hasVideoPressPurchase, isFetchingPurchases } = usePlan();
	const { run } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: product.productSlug,
		redirectUrl: adminUrl,
	} );

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
			onClick={ run }
		/>
	);
};
