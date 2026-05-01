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
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { fileInputExtensions } from '../../../utils/video-extensions';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { useDashboardVideos } from '../../hooks/use-dashboard-videos';
import { usePermission } from '../../hooks/use-permission';
import { usePlan } from '../../hooks/use-plan';
import useSelectVideoFiles from '../../hooks/use-select-video-files';
import { NeedUserConnectionGlobalNotice } from '../global-notice';
import PricingSection from '../pricing-section';
import { ConnectSiteSettingsSection as SettingsSection } from '../site-settings-section';
import { ConnectVideoStorageMeter } from '../video-storage-meter';
import VideoUploadArea from '../video-upload-area';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import styles from './styles.module.scss';

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

	const { isDraggingOver, inputRef, handleFileInputChangeEvent, filterVideoFiles } =
		useSelectVideoFiles( {
			canDrop: canUpload && ! loading,
			dropElement: document,
			onSelectFiles: handleFilesUpload,
		} );

	useAnalyticsTracks( { pageViewEventName: 'jetpack_videopress_admin_page_view' } );

	return (
		<AdminPage
			title={ 'VideoPress' /** "VideoPress" is a product name, do not translate. */ }
			subTitle={ __( 'Professional quality, ad-free video hosting.', 'jetpack-videopress-pkg' ) }
		>
			<div
				className={ clsx( styles[ 'files-overlay' ], {
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
						<Container horizontalSpacing={ 0 }>
							<Col>
								<div id="jp-admin-notices" className={ styles[ 'jetpack-videopress-jitm-card' ] } />
							</Col>
						</Container>

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

							<Col sm={ 4 } md={ 8 } lg={ 8 }>
								<Text variant="headline-small" mb={ 3 }>
									{ __( 'High quality, ad-free video', 'jetpack-videopress-pkg' ) }
								</Text>

								{ hasVideoPressPurchase && (
									<ConnectVideoStorageMeter className={ styles[ 'storage-meter' ] } />
								) }

								{ hasVideos ? (
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
												{ __( 'Add new video', 'jetpack-videopress-pkg' ) }
											</Button>
										) }
										__next40pxDefaultSize={ true }
									/>
								) : (
									<Text variant="title-medium">
										{ __( "Let's add your first video below!", 'jetpack-videopress-pkg' ) }
									</Text>
								) }

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
									<VideoUploadArea
										className={ styles[ 'upload-area' ] }
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
	const { adminUri, siteSuffix } = window.jetpackVideoPressInitialState;

	const { product, hasVideoPressPurchase, isFetchingFeatures } = usePlan();
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- @todo Start extending jetpack-js-tools/eslintrc/react in eslintrc, then we can remove this disable comment.
	const { run } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: product.productSlug,
		redirectUrl: adminUri,
		useBlogIdSuffix: true,
		from: 'jetpack-videopress',
	} );

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- @todo Start extending jetpack-js-tools/eslintrc/react in eslintrc, then we can remove this disable comment.
	const { recordEventHandler } = useAnalyticsTracks( {} );

	if ( hasVideoPressPurchase || isFetchingFeatures ) {
		return null;
	}

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

	return (
		<ContextualUpgradeTrigger
			description={ description }
			cta={ cta }
			className={ styles[ 'upgrade-trigger' ] }
			onClick={ onButtonClickHandler }
		/>
	);
};
