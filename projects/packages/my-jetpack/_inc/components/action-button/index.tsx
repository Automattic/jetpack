import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronDown, external, check } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { PRODUCT_STATUSES, MyJetpackRoutes } from '../../constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useInstallPlugins from '../../data/products/use-install-plugins';
import useProduct from '../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import useOutsideAlerter from '../../hooks/use-outside-alerter';
import styles from './style.module.scss';
import type { SecondaryButtonProps } from './secondary-button';
import type { AdditionalAction } from './types';
import type { FC, ComponentProps, MouseEvent, SetStateAction } from 'react';

const getActionButtonId = ( productSlug: string ) => `action-button-label-${ productSlug }`;

type ActionButtonProps = {
	slug: JetpackModule;
	additionalActions?: AdditionalAction[];
	primaryActionOverride?: Record< string, AdditionalAction >;
	fixSiteConnectionHandler?: ( { e }: { e: MouseEvent< HTMLButtonElement > } ) => void;
	setIsActionLoading?: ( value: SetStateAction< boolean > ) => void;
	className?: string;
	tracksIdentifier?: `${ string }_${ string }`;
	labelSuffixId?: string;
};

const ActionButton: FC< ActionButtonProps > = ( {
	slug,
	additionalActions,
	primaryActionOverride,
	fixSiteConnectionHandler,
	setIsActionLoading,
	className,
	tracksIdentifier,
	labelSuffixId,
} ) => {
	const { lifecycleStats } = getMyJetpackWindowInitialState();
	const { ownedProducts } = lifecycleStats;

	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
	const [ currentAction, setCurrentAction ] = useState< ComponentProps< typeof Button > >( {} );
	const { detail, isLoading: isProductDataLoading } = useProduct( slug );

	const {
		manageUrl,
		purchaseUrl,
		managePaidPlanPurchaseUrl,
		renewPaidPlanPurchaseUrl,
		status,
		requiresUserConnection,
	} = detail;
	const { siteIsRegistering, isRegistered, isUserConnected } = useMyJetpackConnection();
	const isManageDisabled = ! manageUrl;
	const dropdownRef = useRef( null );
	const chevronRef = useRef( null );
	const { recordEvent } = useAnalytics();
	const navigateToConnectionPage = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );
	const { activate, isPending: isActivating } = useActivatePlugins( slug );
	const { install: installStandalonePlugin, isPending: isInstalling } = useInstallPlugins( slug );

	const isBusy =
		isActivating ||
		isProductDataLoading ||
		isInstalling ||
		( siteIsRegistering && status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR );
	const hasAdditionalActions = additionalActions?.length > 0;
	const isOwned = ownedProducts?.includes( slug );
	const troubleshootBackupsUrl =
		'https://jetpack.com/support/backup/troubleshooting-jetpack-backup/';
	const labelledBy = `${ getActionButtonId( slug ) } ${ labelSuffixId || '' }`.trim();

	const buttonState = useMemo< Partial< SecondaryButtonProps > >( () => {
		return {
			variant: ! isBusy ? 'primary' : undefined,
			disabled: isBusy,
			size: 'small',
			weight: 'regular',
			className,
		};
	}, [ isBusy, className ] );

	/*
	 * Redirect only if connected
	 */
	const handleActivate = useCallback( () => {
		if ( ( ! isRegistered || ! isUserConnected ) && requiresUserConnection ) {
			navigateToConnectionPage();
			return;
		}

		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_activate_click`, {
			product: slug,
		} );

		activate();
	}, [
		activate,
		isRegistered,
		isUserConnected,
		requiresUserConnection,
		navigateToConnectionPage,
		recordEvent,
		slug,
		tracksIdentifier,
	] );

	const learnMoreHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_learnmore_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const fixUserConnectionHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_fixconnection_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const addHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_add_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const manageHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_manage_click`, {
			product: slug,
		} );
	}, [ slug, recordEvent, tracksIdentifier ] );

	const installStandaloneHandler = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_install_standalone_plugin_click`, {
			product: slug,
		} );
		installStandalonePlugin();
	}, [ slug, installStandalonePlugin, recordEvent, tracksIdentifier ] );

	const statusAction: SecondaryButtonProps = useMemo( () => {
		switch ( status ) {
			case PRODUCT_STATUSES.ABSENT: {
				const buttonText = __( 'Learn more', 'jetpack-my-jetpack' );
				return {
					...buttonState,
					href: `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: learnMoreHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ABSENT ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.ABSENT_WITH_PLAN: {
				const buttonText = __( 'Install Plugin', 'jetpack-my-jetpack' );
				return {
					...buttonState,
					variant: 'primary',
					label: buttonText,
					onClick: installStandaloneHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ] ?? {} ),
				};
			}
			// The site or user have never been connected before and the connection is required
			case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: addHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ] ?? {} ),
				};
			case PRODUCT_STATUSES.NEEDS_PLAN: {
				const getPlanText = __( 'Get plan', 'jetpack-my-jetpack' );
				const learnMoreText = __( 'Learn more', 'jetpack-my-jetpack' );
				const buttonText = isOwned ? getPlanText : learnMoreText;

				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: addHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_PLAN ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.CAN_UPGRADE: {
				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: __( 'Upgrade', 'jetpack-my-jetpack' ),
					onClick: addHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.CAN_UPGRADE ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.ACTIVE: {
				const buttonText = __( 'View', 'jetpack-my-jetpack' );

				return {
					...buttonState,
					disabled: isManageDisabled || buttonState?.disabled,
					href: manageUrl,
					variant: 'secondary',
					label: buttonText,
					onClick: manageHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.ACTIVE ] ?? {} ),
				};
			}
			case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
				return {
					...buttonState,
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: fixSiteConnectionHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ] ?? {} ),
				};
			case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
				return {
					href: '#/connection?skip_pricing=true',
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: fixUserConnectionHandler,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ] ?? {} ),
				};
			case PRODUCT_STATUSES.INACTIVE:
			case PRODUCT_STATUSES.MODULE_DISABLED:
			case PRODUCT_STATUSES.NEEDS_ACTIVATION:
				return {
					...buttonState,
					variant: 'secondary',
					label: __( 'Activate', 'jetpack-my-jetpack' ),
					onClick: handleActivate,
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.INACTIVE ] ?? {} ),
				};
			case PRODUCT_STATUSES.EXPIRING_SOON:
				return {
					...buttonState,
					href: renewPaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Renew my plan', 'jetpack-my-jetpack' ),
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.EXPIRING_SOON ] ?? {} ),
				};
			case PRODUCT_STATUSES.EXPIRED:
				return {
					...buttonState,
					href: managePaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Resume my plan', 'jetpack-my-jetpack' ),
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.EXPIRED ] ?? {} ),
				};
			case PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR: {
				const defaultButton: Partial< SecondaryButtonProps > = {
					...buttonState,
					href: manageUrl,
					variant: 'primary',
					label: __( 'Troubleshoot', 'jetpack-my-jetpack' ),
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR ] ?? {} ),
				};
				switch ( slug ) {
					case 'backup':
						return {
							...defaultButton,
							href: troubleshootBackupsUrl,
						};
					case 'protect':
						return {
							...defaultButton,
							label: __( 'Fix threats', 'jetpack-my-jetpack' ),
						};
					default:
						return defaultButton;
				}
			}
			case PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING: {
				const defaultButton: Partial< SecondaryButtonProps > = {
					...buttonState,
					href: manageUrl,
					variant: 'primary',
					label: __( 'Troubleshoot', 'jetpack-my-jetpack' ),
					'aria-labelledby': labelledBy,
					...( primaryActionOverride?.[ PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING ] ?? {} ),
				};
				switch ( slug ) {
					case 'protect':
						return {
							...defaultButton,
							label: __( 'Fix threats', 'jetpack-my-jetpack' ),
						};
					default:
						return {
							...defaultButton,
						};
				}
			}
			default:
				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: addHandler,
					'aria-labelledby': labelledBy,
				};
		}
	}, [
		status,
		buttonState,
		slug,
		purchaseUrl,
		isManageDisabled,
		manageUrl,
		primaryActionOverride,
		isOwned,
		managePaidPlanPurchaseUrl,
		renewPaidPlanPurchaseUrl,
		addHandler,
		fixSiteConnectionHandler,
		fixUserConnectionHandler,
		handleActivate,
		installStandaloneHandler,
		learnMoreHandler,
		manageHandler,
		labelledBy,
	] );

	const allActions = useMemo(
		() => ( hasAdditionalActions ? [ ...additionalActions, statusAction ] : [ statusAction ] ),
		[ additionalActions, statusAction, hasAdditionalActions ]
	);

	const recordDropdownStateChange = useCallback( () => {
		recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_dropdown_toggle`, {
			product: slug,
			state: ! isDropdownOpen ? 'open' : 'closed',
		} );
	}, [ isDropdownOpen, recordEvent, slug, tracksIdentifier ] );

	const onChevronClick = useCallback( () => {
		setIsDropdownOpen( ! isDropdownOpen );
		recordDropdownStateChange();
	}, [ isDropdownOpen, recordDropdownStateChange ] );

	// By default, we set the first "addition action" as the current action shown on the card.
	// If there are none, set it to the status action.
	useEffect( () => {
		setCurrentAction( allActions[ 0 ] );
	}, [ allActions ] );

	useEffect( () => {
		if ( setIsActionLoading ) {
			setIsActionLoading( isBusy );
		}
	}, [ isBusy, setIsActionLoading ] );

	// Close the dropdown when clicking outside of it.
	useOutsideAlerter( dropdownRef, e => {
		// Don't need to use outside alerter if chevron is clicked, chevron button will handle it
		if ( ! chevronRef.current.contains( e.target ) ) {
			setIsDropdownOpen( false );
			recordDropdownStateChange();
		}
	} );

	const dropdown = hasAdditionalActions && (
		<div ref={ dropdownRef } className={ styles[ 'action-button-dropdown' ] }>
			<ul className={ styles[ 'dropdown-menu' ] }>
				{ [ ...additionalActions, statusAction ].map( ( { label, isExternalLink }, index ) => {
					const onDropdownMenuItemClick = () => {
						setCurrentAction( allActions[ index ] );
						setIsDropdownOpen( false );

						recordEvent( `jetpack_myjetpack_${ tracksIdentifier }_dropdown_action_click`, {
							product: slug,
							action: label,
						} );
					};

					return (
						<li key={ index }>
							{ /* eslint-disable-next-line react/jsx-no-bind */ }
							<button onClick={ onDropdownMenuItemClick } className={ styles[ 'dropdown-item' ] }>
								<div className={ styles[ 'dropdown-item-label' ] }>
									{ label }
									{ isExternalLink && <Icon icon={ external } size={ 16 } /> }
								</div>

								{ label === currentAction.label && (
									<div className={ styles[ 'active-action-checkmark' ] }>
										<Icon icon={ check } size={ 24 } fill="white" />
									</div>
								) }
							</button>
						</li>
					);
				} ) }
			</ul>
		</div>
	);

	return (
		<>
			<div
				className={ clsx(
					styles[ 'action-button' ],
					hasAdditionalActions ? styles[ 'has-additional-actions' ] : null
				) }
			>
				<Button { ...buttonState } { ...currentAction } id={ getActionButtonId( slug ) }>
					{ currentAction.label }
				</Button>
				{ hasAdditionalActions && (
					<button
						className={ clsx(
							styles[ 'dropdown-chevron' ],
							currentAction.variant === 'primary' ? styles.primary : styles.secondary
						) }
						onClick={ onChevronClick }
						ref={ chevronRef }
					>
						<Icon
							icon={ chevronDown }
							size={ 24 }
							fill={ currentAction.variant === 'primary' ? 'white' : 'black' }
						/>
					</button>
				) }
				{ isDropdownOpen && dropdown }
			</div>
		</>
	);
};

export default ActionButton;
