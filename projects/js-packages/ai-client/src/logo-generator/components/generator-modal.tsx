/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Modal, Button } from '@wordpress/components';
import { useDispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
import { useState, useEffect, useCallback, useRef } from 'react';
/**
 * Internal dependencies
 */
import {
	DEFAULT_LOGO_COST,
	EVENT_MODAL_OPEN,
	EVENT_FEEDBACK,
	EVENT_MODAL_CLOSE,
	EVENT_GENERATE,
} from '../constants.js';
import { useCheckout } from '../hooks/use-checkout.js';
import useLogoGenerator from '../hooks/use-logo-generator.js';
import useRequestErrors from '../hooks/use-request-errors.js';
import { isLogoHistoryEmpty, clearDeletedMedia } from '../lib/logo-storage.js';
import { STORE_NAME } from '../store/index.js';
// import { FairUsageNotice } from './fair-usage-notice.js';
import { FeatureFetchFailureScreen } from './feature-fetch-failure-screen.js';
import { FirstLoadScreen } from './first-load-screen.js';
import { HistoryCarousel } from './history-carousel.js';
import { LogoPresenter } from './logo-presenter.js';
import { Prompt } from './prompt.js';
import { UpgradeScreen } from './upgrade-screen.js';
import { VisitSiteBanner } from './visit-site-banner.js';
import './generator-modal.scss';
/**
 * Types
 */
import type { GeneratorModalProps } from '../types.js';
import type React from 'react';

const debug = debugFactory( 'jetpack-ai-calypso:generator-modal' );

export const GeneratorModal: React.FC< GeneratorModalProps > = ( {
	isOpen,
	onClose,
	onApplyLogo,
	onReload,
	siteDetails,
	context,
	placement,
} ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const { setSiteDetails, fetchAiAssistantFeature, loadLogoHistory, setIsLoadingHistory } =
		useDispatch( STORE_NAME );
	const { getIsRequestingAiAssistantFeature } = select( STORE_NAME );
	const [ loadingState, setLoadingState ] = useState<
		'loadingFeature' | 'analyzing' | 'generating' | null
	>( null );
	const [ initialPrompt, setInitialPrompt ] = useState< string | undefined >();
	const needsToHandleModalOpen = useRef< boolean >( true );
	const requestedFeatureData = useRef< boolean >( false );
	const [ needsFeature, setNeedsFeature ] = useState( false );
	const [ needsMoreRequests, setNeedsMoreRequests ] = useState( false );
	const {
		selectedLogo,
		getAiAssistantFeature,
		generateFirstPrompt,
		generateLogo,
		setContext,
		tierPlansEnabled,
		site,
		requireUpgrade,
	} = useLogoGenerator();
	const { featureFetchError, firstLogoPromptFetchError, clearErrors } = useRequestErrors();
	const siteId = siteDetails?.ID;
	const [ logoAccepted, setLogoAccepted ] = useState( false );
	const { nextTierCheckoutURL: upgradeURL } = useCheckout();

	// First fetch the feature data so we have the most up-to-date info from the backend.
	const feature = getAiAssistantFeature();

	const generateFirstLogo = useCallback( async () => {
		try {
			// First generate the prompt based on the site's data.
			setLoadingState( 'analyzing' );
			recordTracksEvent( EVENT_GENERATE, { context, tool: 'first-prompt' } );
			const prompt = await generateFirstPrompt();
			setInitialPrompt( prompt );

			// Then generate the logo based on the prompt.
			setLoadingState( 'generating' );
			await generateLogo( { prompt } );
			setLoadingState( null );
		} catch ( error ) {
			debug( 'Error generating first logo', error );
			setLoadingState( null );
		}
	}, [ context, generateFirstPrompt, generateLogo ] );

	/*
	 * Called ONCE to check the feature data to make sure the site is allowed to do the generation.
	 * Also, checks site history and trigger a new generation in case there are no logos to present.
	 */
	const initializeModal = useCallback( async () => {
		try {
			const hasHistory = ! isLogoHistoryEmpty( String( siteId ) );

			const logoCost = feature?.costs?.[ 'jetpack-ai-logo-generator' ]?.logo ?? DEFAULT_LOGO_COST;
			const promptCreationCost = 1;
			const currentLimit = feature?.currentTier?.limit || 0;
			const currentValue = feature?.currentTier?.value || 0;
			const currentUsage = feature?.usagePeriod?.requestsCount || 0;
			const isUnlimited = ! tierPlansEnabled ? currentValue > 0 : currentValue === 1;
			const hasNoNextTier = ! feature?.nextTier; // If there is no next tier, the user cannot upgrade.

			// The user needs an upgrade immediately if they have no logos and not enough requests remaining for one prompt and one logo generation.
			const siteNeedsMoreRequests =
				! isUnlimited &&
				! hasNoNextTier &&
				! hasHistory &&
				( tierPlansEnabled
					? currentLimit - currentUsage < logoCost + promptCreationCost
					: currentLimit < currentUsage );

			// If the site requires an upgrade, show the upgrade screen immediately.
			setNeedsFeature( currentLimit === 0 );
			setNeedsMoreRequests( siteNeedsMoreRequests );

			if ( currentLimit === 0 || siteNeedsMoreRequests ) {
				setLoadingState( null );
				return;
			}

			setIsLoadingHistory( true );
			// Load the logo history and clear any deleted media.
			await clearDeletedMedia( String( siteId ) );
			loadLogoHistory( siteId );

			// If there is any logo, we do not need to generate a first logo again.
			if ( hasHistory ) {
				setLoadingState( null );
				setIsLoadingHistory( false );
				return;
			}

			// if site requires an upgrade, just return and set loaders to null,
			// prompt component will take over the situation
			if ( requireUpgrade ) {
				setLoadingState( null );
				setIsLoadingHistory( false );
				return;
			}

			// If the site does not require an upgrade and has no logos stored
			// and has title and description, generate the first prompt based on the site's data.
			if (
				site &&
				site.name &&
				site.description &&
				site.name !== __( 'Site Title', 'jetpack-ai-client' )
			) {
				generateFirstLogo();
			} else {
				setLoadingState( null );
				setIsLoadingHistory( false );
			}
		} catch ( error ) {
			debug( 'Error fetching feature', error );
			setLoadingState( null );
			setIsLoadingHistory( false );
		}
	}, [
		feature,
		generateFirstLogo,
		loadLogoHistory,
		clearDeletedMedia,
		isLogoHistoryEmpty,
		siteId,
		requireUpgrade,
	] );

	const handleModalOpen = useCallback( async () => {
		setContext( context );
		recordTracksEvent( EVENT_MODAL_OPEN, { context, placement } );

		initializeModal();
	}, [ setContext, context, placement, initializeModal ] );

	const closeModal = () => {
		// Reset the state when the modal is closed, so we trigger the modal initialization again when it's opened.
		needsToHandleModalOpen.current = true;
		onClose();
		setLoadingState( null );
		setNeedsFeature( false );
		setNeedsMoreRequests( false );
		clearErrors();
		setLogoAccepted( false );
		setIsLoadingHistory( false );
		recordTracksEvent( EVENT_MODAL_CLOSE, { context, placement } );
	};

	const handleApplyLogo = ( mediaId: number ) => {
		setLogoAccepted( true );
		onApplyLogo?.( mediaId );
	};

	const handleFeedbackClick = () => {
		recordTracksEvent( EVENT_FEEDBACK, { context } );
	};

	// Set site details when siteId changes
	useEffect( () => {
		if ( siteId ) {
			setSiteDetails( siteDetails );
		}

		// When the site details are set, we need to fetch the feature data.
		if ( ! requestedFeatureData.current ) {
			const isRequestingFeature = getIsRequestingAiAssistantFeature();
			if ( ! isRequestingFeature ) {
				requestedFeatureData.current = true;
				fetchAiAssistantFeature();
			}
		}
	}, [ siteId, siteDetails, setSiteDetails, getIsRequestingAiAssistantFeature ] );

	// Handles modal opening logic
	useEffect( () => {
		// While the modal is not open, the siteId is not set, or the feature data is not available, do nothing.
		if ( ! isOpen || ! siteId || ! feature?.costs ) {
			return;
		}

		// Prevent multiple calls of the handleModalOpen function
		if ( needsToHandleModalOpen.current ) {
			needsToHandleModalOpen.current = false;
			handleModalOpen();
		}
	}, [ isOpen, siteId, handleModalOpen, feature ] );

	let body: React.ReactNode;

	if ( loadingState ) {
		body = <FirstLoadScreen state={ loadingState } />;
	} else if ( featureFetchError || firstLogoPromptFetchError ) {
		body = (
			<FeatureFetchFailureScreen
				onCancel={ closeModal }
				onRetry={ () => {
					closeModal();
					onReload?.();
				} }
			/>
		);
	} else if ( needsFeature || needsMoreRequests ) {
		body = (
			<UpgradeScreen
				onCancel={ closeModal }
				upgradeURL={ upgradeURL }
				reason={ needsFeature ? 'feature' : 'requests' }
			/>
		);
	} else {
		body = (
			<>
				{ ! logoAccepted && <Prompt initialPrompt={ initialPrompt } /> }

				<LogoPresenter
					logo={ selectedLogo }
					onApplyLogo={ handleApplyLogo }
					logoAccepted={ logoAccepted }
					siteId={ String( siteId ) }
				/>
				{ logoAccepted ? (
					<div className="jetpack-ai-logo-generator__accept">
						<VisitSiteBanner />
						<div className="jetpack-ai-logo-generator__accept-actions">
							<Button variant="primary" onClick={ closeModal }>
								{ __( 'Close', 'jetpack-ai-client' ) }
							</Button>
						</div>
					</div>
				) : (
					<>
						<HistoryCarousel />
						<div className="jetpack-ai-logo-generator__footer">
							<Button
								variant="link"
								className="jetpack-ai-logo-generator__feedback-button"
								href="https://jetpack.com/redirect/?source=jetpack-ai-feedback"
								target="_blank"
								onClick={ handleFeedbackClick }
							>
								<span>{ __( 'Provide feedback', 'jetpack-ai-client' ) }</span>
								<Icon icon={ external } className="icon" />
							</Button>
						</div>
					</>
				) }
			</>
		);
	}

	return (
		<>
			{ isOpen && (
				<Modal
					className="jetpack-ai-logo-generator-modal"
					onRequestClose={ closeModal }
					shouldCloseOnClickOutside={ false }
					shouldCloseOnEsc={ false }
					title={ __( 'Jetpack AI Logo Generator', 'jetpack-ai-client' ) }
				>
					<div
						className={ clsx( 'jetpack-ai-logo-generator-modal__body', {
							'notice-modal':
								needsFeature || needsMoreRequests || featureFetchError || firstLogoPromptFetchError,
						} ) }
					>
						{ body }
					</div>
				</Modal>
			) }
		</>
	);
};
