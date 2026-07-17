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
} from '@automattic/jetpack-components';
import {
	useProductCheckoutWorkflow,
	useConnectionErrorNotice,
	ConnectionError,
} from '@automattic/jetpack-connection';
import { FormFileUpload } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
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

	const isSm = useViewportMatch( 'small', '<' );

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
				<div className={ styles[ 'hero-shrink-guard' ] }>
					<AdminSectionHero>
						<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
							<Col sm={ 4 } md={ 8 } lg={ 12 }>
								<PricingSection onRedirecting={ () => setShowPricingSection( true ) } />
							</Col>
						</Container>
					</AdminSectionHero>
				</div>
			) : (
				<>
					<div className={ styles[ 'hero-shrink-guard' ] }>
						<AdminSectionHero>
							<Container horizontalSpacing={ 0 }>
								<Col>
									<div
										id="jp-admin-notices"
										className={ styles[ 'jetpack-videopress-jitm-card' ] }
									/>
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
					</div>
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

// VIDP-245: keep these `__()` calls at module scope as separate statements.
// If they live as the two arms of an inline ternary, terser folds them into a
// single `__( cond ? 'a' : 'b', domain )`, which breaks string-literal POT
// extraction (the i18n-check-webpack-plugin fails the production build).
const UPGRADE_TRIGGER_USED_VIDEO_TEXT = __(
	'You have used your free video upload',
	'jetpack-videopress-pkg'
);
const UPGRADE_TRIGGER_FREE_PLAN_TEXT = __(
	'The free plan includes one video upload.',
	'jetpack-videopress-pkg'
);
const UPGRADE_TRIGGER_UNLOCK_TEXT = __(
	'Unlock unlimited videos, 1TB of storage, and more!',
	'jetpack-videopress-pkg'
);

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

	// VIDP-245: keep the `Notice.Root` children shape invariant across the
	// `hasUsedVideo` flip. base-ui@1.4.1's `useRenderElement` swaps between two
	// different ref-merge hooks depending on subtree shape, so conditionally
	// mounting/unmounting a `Notice` subcomponent across the flip misaligns its
	// stored fork-ref and crashes on the next upload/delete. Therefore always
	// render `Notice.Title`, `Notice.Description` and `Notice.Actions` — never
	// wrap any of them in a `hasUsedVideo && (...)` conditional. Vary only the
	// TEXT: the `title` line carries the contextual heads-up (non-empty in both
	// states) while the Description holds the constant upsell pitch. The strings
	// are hoisted to module scope (above) to avoid the terser i18n ternary-fold.
	const title = hasUsedVideo ? UPGRADE_TRIGGER_USED_VIDEO_TEXT : UPGRADE_TRIGGER_FREE_PLAN_TEXT;
	const cta = __( 'Upgrade', 'jetpack-videopress-pkg' );

	return (
		<Notice.Root intent="info" className={ styles[ 'upgrade-trigger' ] }>
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ UPGRADE_TRIGGER_UNLOCK_TEXT }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton onClick={ onButtonClickHandler }>{ cta }</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
};
