import { JetpackLogo } from '@automattic/jetpack-components';
import { useQueryClient } from '@tanstack/react-query';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AlertDialog, Link, Spinner } from '@wordpress/ui';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { BlankCanvas } from '../../compat/components/blank-canvas';
import { useRouteModal } from '../../compat/route-modal';
import page from '../../compat/router';
import {
	useDispatch,
	useSelector,
	getPreviousRoute,
	getSiteSlug,
	getSelectedSite,
	getSelectedSiteSlug,
} from '../../compat/state';
import { useTranslate } from '../../compat/translate';
import { getUrlParts, useLocale, useLocalizeUrl } from '../../compat/utils';
import {
	showDSP,
	usePromoteWidget,
	PromoteWidgetStatus,
	cleanupDSP,
	useDspOriginProps,
} from '../../lib/promote-post';
import { getAdvertisingDashboardPath } from '../../promote-post-i2/utils';
import './style.scss';

export type BlazePressPromotionProps = {
	isVisible: boolean;
	siteId: string | number;
	postId: string | number;
	campaignId?: string;
	keyValue: string;
	source?: string;
};

/**
 *
 */
export function goToOriginalEndpoint() {
	const { pathname } = getUrlParts( window.location.href );
	const index = pathname.indexOf( '/promote/' );
	page( index < 0 ? pathname : pathname.replace( /\/promote\/.*?\//, '/' ) );
}

const BlazePressWidget = ( props: BlazePressPromotionProps ) => {
	const { isVisible = false, keyValue, siteId } = props;
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( false );
	const [ showCancelDialog, setShowCancelDialog ] = useState( false );
	const [ showCancelButton, setShowCancelButton ] = useState( true );
	const [ hiddenHeader, setHiddenHeader ] = useState( true );
	const widgetContainer = useRef< HTMLDivElement >( null );
	const selectedSiteSlug = useSelector( getSelectedSiteSlug );
	const translate = useTranslate();
	const localizeUrl = useLocalizeUrl();
	const previousRoute = useSelector( getPreviousRoute );
	const selectedSite = useSelector( getSelectedSite );
	const jetpackVersion = selectedSite?.options?.jetpack_version;
	const blazeAdsVersion = selectedSite?.options?.blaze_ads_version;
	const siteSlug = useSelector( state => getSiteSlug( state, selectedSite?.ID ) );
	const { closeModal } = useRouteModal( 'blazepress-widget', keyValue );
	const queryClient = useQueryClient();
	const localeSlug = useLocale();
	const dspOriginProps = useDspOriginProps();
	const dispatch = useDispatch();

	// Scroll to top on initial load regardless of previous page position
	useEffect( () => {
		if ( isVisible ) {
			window.scrollTo( 0, 0 );
		}
	}, [ isVisible ] );

	useEffect( () => {
		return () => {
			// Execute Widget Cleanup function
			cleanupDSP();
		};
	}, [] );

	const handleShowCancel = ( show: boolean ) => setShowCancelButton( show );
	const handleShowTopBar = ( show: boolean ) => {
		setHiddenHeader( ! show );
	};

	const onClose = ( goToCampaigns?: boolean ) => {
		queryClient.invalidateQueries( {
			queryKey: [ 'promote-post-campaigns', siteId ],
		} );
		if ( goToCampaigns ) {
			page( getAdvertisingDashboardPath( `/campaigns/${ siteSlug }` ) );
		} else {
			if ( queryClient ) {
				queryClient.invalidateQueries( {
					queryKey: [ 'promote-post-campaigns', siteId ],
				} );
			}
			if ( previousRoute ) {
				closeModal();
			} else {
				goToOriginalEndpoint();
			}
		}
	};

	useEffect( () => {
		isVisible &&
			( async () => {
				if ( props.siteId === null || props.postId === null ) {
					return;
				}
				const source = props.source || 'blazepress';

				try {
					await showDSP(
						selectedSiteSlug,
						props.siteId,
						props.postId,
						onClose,
						source,
						translate,
						localizeUrl,
						widgetContainer.current,
						handleShowCancel,
						handleShowTopBar,
						localeSlug,
						jetpackVersion,
						blazeAdsVersion,
						dispatch,
						dspOriginProps,
						props.campaignId
					);
				} catch {
					setError( true );
					setHiddenHeader( false );
				}
				setIsLoading( false );
			} )();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Boots the remote widget once per post; the other values are read at boot.
	}, [ isVisible, props.postId, props.siteId, selectedSiteSlug ] );

	const onCancelDialogOpenChange = ( open: boolean ) => {
		if ( ! open ) {
			setShowCancelDialog( false );
		}
	};

	const onConfirmQuit = () => {
		setShowCancelDialog( false );
		onClose();
	};

	const promoteWidgetStatus = usePromoteWidget();
	if ( promoteWidgetStatus === PromoteWidgetStatus.DISABLED ) {
		return <></>;
	}

	return (
		<>
			{ isVisible && (
				<BlankCanvas
					className={ clsx( 'blazepress-widget', 'blazepress-i2', {
						'hidden-header': hiddenHeader,
					} ) }
				>
					<BlankCanvas.Header
						className={ clsx( 'blazepress-widget__header-bar', {
							'no-back-button': ! showCancelButton,
						} ) }
						onBackClick={ () => {
							if ( error ) {
								// Close without dialog if we are displaying the error page (no need to confirmation there)
								setShowCancelDialog( false );
								onClose();
							} else {
								setShowCancelDialog( true );
							}
						} }
					>
						<h2>Blaze Ads</h2>
						<div className="blazepress-widget__jetpack-powered">
							<JetpackLogo showText={ false } height={ 18 } logoColor="currentColor" />
							<span>{ __( 'Jetpack powered', 'jetpack-blaze' ) }</span>
						</div>
					</BlankCanvas.Header>

					<div className={ clsx( 'blazepress-widget__content', { loading: isLoading } ) }>
						<AlertDialog.Root
							open={ showCancelDialog && showCancelButton }
							onOpenChange={ onCancelDialogOpenChange }
							onConfirm={ onConfirmQuit }
						>
							<AlertDialog.Popup
								className="blazepress-widget__cancel-dialog"
								intent="irreversible"
								title={ __( 'Are you sure you want to quit?', 'jetpack-blaze' ) }
								description={ __(
									'If you quit, all of the work that has been done during this session will be lost.',
									'jetpack-blaze'
								) }
								cancelButtonText={ __( 'No, let me finish', 'jetpack-blaze' ) }
								confirmButtonText={ __( 'Yes, quit', 'jetpack-blaze' ) }
							/>
						</AlertDialog.Root>
						{ isLoading && <Spinner className="blazepress-widget__spinner" /> }
						{ error && (
							<div className="error-notice">
								<h3 className="error-notice__title">
									{ __( 'Oops, something went wrong', 'jetpack-blaze' ) }
								</h3>
								<p className="error-notice__body">
									{ createInterpolateElement(
										__(
											'Please try again soon or <a>contact support</a> for help.',
											'jetpack-blaze'
										),
										{
											a: <Link href="https://wordpress.com/help/contact" openInNewTab />,
										}
									) }
								</p>
							</div>
						) }
						<div className="blazepress-widget__widget-container" ref={ widgetContainer }></div>
					</div>
				</BlankCanvas>
			) }
		</>
	);
};

export default BlazePressWidget;
