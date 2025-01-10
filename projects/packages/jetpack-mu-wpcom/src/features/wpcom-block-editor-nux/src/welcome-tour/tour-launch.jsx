import { useLocale } from '@automattic/i18n-utils';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import {
	WpcomTourKit,
	usePrefetchTourAssets,
	START_WRITING_FLOW,
	DESIGN_FIRST_FLOW,
	useSiteIntent,
	useSitePlan,
} from '../../../../common/tour-kit';
import { wpcomTrackEvent } from '../../../../common/tracks';
import { getEditorType } from './get-editor-type';
import useTourSteps from './use-tour-steps';
import './style-tour.scss';

/**
 * The Welcome Tour of the Launch.
 *
 * @return {JSX.Element|null} The welcome tour component or null.
 */
function LaunchWpcomWelcomeTour() {
	const { show, isNewPageLayoutModalOpen, isManuallyOpened } = useSelect(
		select => ( {
			show: select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideShown(),
			// Handle the case where the new page pattern modal is initialized and open
			isNewPageLayoutModalOpen:
				select( 'automattic/starter-page-layouts' ) &&
				select( 'automattic/starter-page-layouts' ).isOpen(),
			isManuallyOpened: select( 'automattic/wpcom-welcome-guide' ).isWelcomeGuideManuallyOpened(),
		} ),
		[]
	);
	const { siteIntent, siteIntentFetched } = useSiteIntent();
	const localeSlug = useLocale();
	const editorType = getEditorType();
	const { siteIntent: intent } = useSiteIntent();
	// We check the URL param along with site intent because the param loads faster and prevents element flashing.
	const isBlogOnboardingFlow = intent === START_WRITING_FLOW || intent === DESIGN_FIRST_FLOW;

	const tourSteps = useTourSteps( localeSlug, false, false, null, siteIntent );

	// Preload first card image (others preloaded after open state confirmed)
	usePrefetchTourAssets( [ tourSteps[ 0 ] ] );

	useEffect( () => {
		if ( isBlogOnboardingFlow ) {
			return;
		}
		if ( ! show && ! isNewPageLayoutModalOpen ) {
			return;
		}

		if ( ! siteIntentFetched ) {
			return;
		}

		// Track opening of the Welcome Guide
		wpcomTrackEvent( 'calypso_editor_wpcom_tour_open', {
			is_gutenboarding: window.calypsoifyGutenberg?.isGutenboarding,
			is_manually_opened: isManuallyOpened,
			intent: siteIntent,
			editor_type: editorType,
		} );
	}, [
		isNewPageLayoutModalOpen,
		isManuallyOpened,
		show,
		siteIntent,
		siteIntentFetched,
		editorType,
		isBlogOnboardingFlow,
	] );

	if ( ! show || isNewPageLayoutModalOpen || isBlogOnboardingFlow ) {
		return null;
	}

	return <WelcomeTour { ...{ siteIntent } } />;
}

/**
 * Display the welcome tour.
 *
 * @param {object} props            - The props of the component.
 * @param {string} props.siteIntent - The intent of the site.
 * @return {JSX.Element|null} The WelcomeTour component if a theme name is found, otherwise null.
 */
function WelcomeTour( { siteIntent } ) {
	const sitePlan = useSitePlan( window._currentSiteId );
	const localeSlug = useLocale();
	const { setShowWelcomeGuide } = useDispatch( 'automattic/wpcom-welcome-guide' );
	const isGutenboarding = window.calypsoifyGutenberg?.isGutenboarding;
	const isWelcomeTourNext = () => {
		return new URLSearchParams( document.location.search ).has( 'welcome-tour-next' );
	};
	const isSiteEditor = useSelect( select => !! select( 'core/edit-site' ), [] );
	const currentTheme = useSelect( select => select( 'core' ).getCurrentTheme() );
	const themeName = currentTheme?.name?.raw?.toLowerCase() ?? null;

	const tourSteps = useTourSteps(
		localeSlug,
		isWelcomeTourNext(),
		isSiteEditor,
		themeName,
		siteIntent
	);

	// Only keep Payment block step if user comes from seller simple flow
	if ( ! ( 'sell' === siteIntent && sitePlan && 'ecommerce-bundle' !== sitePlan.product_slug ) ) {
		const paymentBlockIndex = tourSteps.findIndex( step => step.slug === 'payment-block' );
		tourSteps.splice( paymentBlockIndex, 1 );
	}
	const { isInserterOpened, isSidebarOpened, isSettingsOpened } = useSelect(
		select => ( {
			isInserterOpened: select( 'core/edit-post' ).isInserterOpened(),
			isSidebarOpened: select( 'automattic/block-editor-nav-sidebar' )?.isSidebarOpened() ?? false, // The sidebar store may not always be loaded.
			isSettingsOpened:
				select( 'core/interface' ).getActiveComplementaryArea( 'core/edit-post' ) ===
				'edit-post/document',
		} ),
		[]
	);

	const isTourMinimized =
		isSidebarOpened ||
		( window.matchMedia( `(max-width: 782px)` ).matches &&
			( isInserterOpened || isSettingsOpened ) );

	const editorType = getEditorType();

	const tourConfig = {
		steps: tourSteps,
		closeHandler: ( _steps, currentStepIndex, source ) => {
			wpcomTrackEvent( 'calypso_editor_wpcom_tour_dismiss', {
				is_gutenboarding: isGutenboarding,
				slide_number: currentStepIndex + 1,
				action: source,
				intent: siteIntent,
				editor_type: editorType,
			} );
			setShowWelcomeGuide( false, { openedManually: false } );
		},
		isMinimized: isTourMinimized,
		options: {
			tourRating: {
				enabled: true,
				useTourRating: () => {
					return useSelect(
						select => select( 'automattic/wpcom-welcome-guide' ).getTourRating(),
						[]
					);
				},
				onTourRate: rating => {
					dispatch( 'automattic/wpcom-welcome-guide' ).setTourRating( rating );
					wpcomTrackEvent( 'calypso_editor_wpcom_tour_rate', {
						thumbs_up: rating === 'thumbs-up',
						is_gutenboarding: false,
						intent: siteIntent,
						editor_type: editorType,
					} );
				},
			},
			callbacks: {
				onMinimize: currentStepIndex => {
					wpcomTrackEvent( 'calypso_editor_wpcom_tour_minimize', {
						is_gutenboarding: isGutenboarding,
						slide_number: currentStepIndex + 1,
						intent: siteIntent,
						editor_type: editorType,
					} );
				},
				onMaximize: currentStepIndex => {
					wpcomTrackEvent( 'calypso_editor_wpcom_tour_maximize', {
						is_gutenboarding: isGutenboarding,
						slide_number: currentStepIndex + 1,
						intent: siteIntent,
						editor_type: editorType,
					} );
				},
				onStepViewOnce: currentStepIndex => {
					const lastStepIndex = tourSteps.length - 1;
					const { heading } = tourSteps[ currentStepIndex ].meta;

					wpcomTrackEvent( 'calypso_editor_wpcom_tour_slide_view', {
						slide_number: currentStepIndex + 1,
						is_last_slide: currentStepIndex === lastStepIndex,
						slide_heading: heading,
						is_gutenboarding: isGutenboarding,
						intent: siteIntent,
						editor_type: editorType,
					} );
				},
			},
			effects: {
				spotlight: isWelcomeTourNext()
					? {
							styles: {
								minWidth: '50px',
								minHeight: '50px',
								borderRadius: '2px',
							},
					  }
					: undefined,
				arrowIndicator: false,
			},
			popperModifiers: [
				useMemo(
					() => ( {
						name: 'offset',
						options: {
							offset: ( { placement, reference } ) => {
								if ( placement === 'bottom' ) {
									const boundary = document.querySelector( '.edit-post-header' );

									if ( ! boundary ) {
										return;
									}

									const boundaryRect = boundary.getBoundingClientRect();
									const boundaryBottomY = boundaryRect.height + boundaryRect.y;
									const referenceBottomY = reference.height + reference.y;

									return [ 0, boundaryBottomY - referenceBottomY + 16 ];
								}
								return [ 0, 0 ];
							},
						},
					} ),
					[]
				),
			],
			classNames: 'wpcom-editor-welcome-tour',
			portalParentElement: document.getElementById( 'wpwrap' ),
		},
	};

	// Theme isn't immediately available, so we prevent rendering so the content doesn't switch after it is presented, since some content is based on theme
	if ( null === themeName ) {
		return null;
	}

	return <WpcomTourKit config={ tourConfig } />;
}

export default LaunchWpcomWelcomeTour;
