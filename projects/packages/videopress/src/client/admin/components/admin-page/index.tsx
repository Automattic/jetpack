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
	useConnectionErrorNotice,
	ConnectionError,
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
import { usePermission } from '../../hooks/use-permission';
import { usePlan } from '../../hooks/use-plan';
import useSelectVideoFiles from '../../hooks/use-select-video-files';
import useVideos, { useLocalVideos } from '../../hooks/use-videos';
import { NeedUserConnectionGlobalNotice } from '../global-notice';
import Logo from '../logo';
import PricingSection from '../pricing-section';
import { ConnectSiteSettingsSection as SettingsSection } from '../site-settings-section';
import { ConnectVideoStorageMeter } from '../video-storage-meter';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';

const useDashboardVideos = () => {
	const { uploadVideo, uploadVideoFromLibrary } = useDispatch( STORE_ID );

	const { items, uploading, uploadedVideoCount, isFetching, search, page } = useVideos();
	const { items: localVideos, uploadedLocalVideoCount } = useLocalVideos();
	const { hasVideoPressPurchase } = usePlan();

	// Do not show uploading videos if not in the first page or searching
	let videos = page > 1 || Boolean( search ) ? items : [ ...uploading, ...items ];

	const hasVideos = uploadedVideoCount > 0 || isFetching || uploading?.length > 0;
	const hasLocalVideos = uploadedLocalVideoCount > 0;

	const handleFilesUpload = ( files: File[] ) => {
		if ( hasVideoPressPurchase ) {
			files.forEach( file => {
				uploadVideo( file );
			} );
		} else if ( files.length > 0 ) {
			uploadVideo( files[ 0 ] );
		}
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
		hasVideoPressPurchase,
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
		hasVideoPressPurchase,
	} = useDashboardVideos();

	const { canPerformAction, isRegistered, hasConnectedOwner, isUserConnected } = usePermission();
	const { hasConnectionError } = useConnectionErrorNotice();

	const [ showPricingSection, setShowPricingSection ] = useState( ! isRegistered );

	const [ isSm ] = useBreakpointMatch( 'sm' );

	const canUpload = ( hasVideoPressPurchase || ! hasVideos ) && canPerformAction;

	const {
		isDraggingOver,
		inputRef,
		handleFileInputChangeEvent,
		filterVideoFiles,
	} = useSelectVideoFiles( {
		canDrop: canUpload && ! loading,
		dropElement: document,
		onSelectFiles: handleFilesUpload,
	} );

	const addNewLabel = __( 'Add new video', 'jetpack-videopress-pkg' );
	const addFirstLabel = __( 'Add your first video', 'jetpack-videopress-pkg' );
	const addVideoLabel = hasVideos ? addNewLabel : addFirstLabel;

	useAnalyticsTracks( { pageViewEventName: 'jetpack_videopress_admin_page_view' } );

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Logo /> }
		>
			<div
				className={ classnames( styles[ 'files-overlay' ], {
					[ styles.hover ]: isDraggingOver && canUpload && ! loading,
				} ) }
			>
				<Text className={ styles[ 'drop-text' ] } variant="headline-medium">
					{ __( 'Drop files to upload', 'jetpack-videopress-pkg' ) }
				</Text>

				<input
					ref={ inputRef }
					type="file"
					accept={ fileInputExtensions }
					className={ styles[ 'file-input' ] }
					onChange={ handleFileInputChangeEvent }
				/>
			</div>

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

							{ ( ! hasConnectedOwner || ! isUserConnected ) && (
								<Col sm={ 4 } md={ 8 } lg={ 12 }>
									<NeedUserConnectionGlobalNotice />
								</Col>
							) }
							<Col sm={ 4 } md={ 4 } lg={ 8 }>
								<Text variant="headline-small" mb={ 3 }>
									{ __( 'High quality, ad-free video', 'jetpack-videopress-pkg' ) }
								</Text>

								{ hasVideoPressPurchase && (
									<ConnectVideoStorageMeter
										className={ styles[ 'storage-meter' ] }
										progressBarClassName={ styles[ 'storage-meter__progress-bar' ] }
									/>
								) }

								<FormFileUpload
									onChange={ evt =>
										handleFilesUpload( filterVideoFiles( evt.currentTarget.files ) )
									}
									accept={ fileInputExtensions }
									multiple={ hasVideoPressPurchase }
									render={ ( { openFileDialog } ) => (
										<Button
											fullWidth={ isSm }
											onClick={ openFileDialog }
											isLoading={ loading }
											disabled={ ! canUpload }
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
										className={ classnames( styles[ 'upload-area' ], {
											[ styles.small ]: isSm,
										} ) }
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

					<AdminSection>
						<SettingsSection />
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
