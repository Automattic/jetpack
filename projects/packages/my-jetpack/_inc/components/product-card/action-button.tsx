import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown, external, check } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import useOutsideAlerter from '../../hooks/use-outside-alerter';
import styles from './style.module.scss';
import { ProductCardProps } from '.';
import type { SecondaryButtonProps } from './secondary-button';
import type { FC, ComponentProps } from 'react';

type ActionButtonProps< A = () => void > = ProductCardProps & {
	onFixConnection?: A;
	onManage?: A;
	onAdd?: A;
	onInstall?: A;
	onLearnMore?: A;
	className?: string;
	isOwned?: boolean;
};

const debug = debugFactory( 'my-jetpack:product-card:action-button' );

const ActionButton: FC< ActionButtonProps > = ( {
	status,
	admin,
	name,
	slug,
	onActivate,
	additionalActions,
	primaryActionOverride,
	onManage,
	onFixConnection,
	isFetching,
	isInstallingStandalone,
	className,
	onAdd,
	onInstall,
	onLearnMore,
	upgradeInInterstitial,
	isOwned,
} ) => {
	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
	const [ currentAction, setCurrentAction ] = useState< ComponentProps< typeof Button > >( {} );
	const { detail } = useProduct( slug );
	const { manageUrl, purchaseUrl, managePaidPlanPurchaseUrl, renewPaidPlanPurchaseUrl } = detail;
	const isManageDisabled = ! manageUrl;
	const dropdownRef = useRef( null );
	const chevronRef = useRef( null );
	const { recordEvent } = useAnalytics();

	slug === 'jetpack-ai' && debug( slug, detail );

	const isBusy = isFetching || isInstallingStandalone;
	const hasAdditionalActions = additionalActions?.length > 0;

	const buttonState = useMemo< Partial< SecondaryButtonProps > >( () => {
		return {
			variant: ! isBusy ? 'primary' : undefined,
			disabled: isBusy,
			size: 'small',
			weight: 'regular',
			className,
		};
	}, [ isBusy, className ] );

	const getStatusAction = useCallback( (): SecondaryButtonProps => {
		slug === 'jetpack-ai' && debug( slug, status );
		switch ( status ) {
			case PRODUCT_STATUSES.ABSENT: {
				const buttonText = __( 'Learn more', 'jetpack-my-jetpack' );
				return {
					...buttonState,
					href: `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: onLearnMore,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.ABSENT in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.ABSENT ] ),
				};
			}
			case PRODUCT_STATUSES.ABSENT_WITH_PLAN: {
				const buttonText = __( 'Install Plugin', 'jetpack-my-jetpack' );
				return {
					...buttonState,
					variant: 'primary',
					label: buttonText,
					onClick: onInstall,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.ABSENT_WITH_PLAN in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ] ),
				};
			}
			// The site or user have never been connected before and the connection is required
			case PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION:
				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ] ),
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
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.NEEDS_PLAN in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.NEEDS_PLAN ] ),
				};
			}
			case PRODUCT_STATUSES.CAN_UPGRADE: {
				const upgradeText = __( 'Upgrade', 'jetpack-my-jetpack' );
				const purchaseText = __( 'Learn more', 'jetpack-my-jetpack' );
				const buttonText = purchaseUrl || upgradeInInterstitial ? upgradeText : purchaseText;

				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					variant: 'primary',
					label: buttonText,
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.CAN_UPGRADE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.CAN_UPGRADE ] ),
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
					onClick: onManage,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.ACTIVE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.ACTIVE ] ),
				};
			}
			case PRODUCT_STATUSES.SITE_CONNECTION_ERROR:
				return {
					...buttonState,
					href: '#/connection',
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: onFixConnection,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.SITE_CONNECTION_ERROR in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ] ),
				};
			case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
				return {
					href: '#/connection',
					variant: 'primary',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: onFixConnection,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.USER_CONNECTION_ERROR in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ] ),
				};
			case PRODUCT_STATUSES.INACTIVE:
			case PRODUCT_STATUSES.MODULE_DISABLED:
			case PRODUCT_STATUSES.NEEDS_ACTIVATION:
				return {
					...buttonState,
					variant: 'secondary',
					label: __( 'Activate', 'jetpack-my-jetpack' ),
					onClick: onActivate,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.INACTIVE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.INACTIVE ] ),
				};
			case PRODUCT_STATUSES.EXPIRING_SOON:
				return {
					...buttonState,
					href: renewPaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Renew my plan', 'jetpack-my-jetpack' ),
					...( primaryActionOverride &&
						PRODUCT_STATUSES.EXPIRING_SOON in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.EXPIRING_SOON ] ),
				};
			case PRODUCT_STATUSES.EXPIRED:
				return {
					...buttonState,
					href: managePaidPlanPurchaseUrl,
					variant: 'primary',
					label: __( 'Resume my plan', 'jetpack-my-jetpack' ),
					...( primaryActionOverride &&
						PRODUCT_STATUSES.EXPIRED in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.EXPIRED ] ),
				};
			default:
				return null;
		}
	}, [
		status,
		buttonState,
		slug,
		onAdd,
		onFixConnection,
		onActivate,
		onInstall,
		onLearnMore,
		purchaseUrl,
		upgradeInInterstitial,
		isManageDisabled,
		manageUrl,
		onManage,
		primaryActionOverride,
		isOwned,
		managePaidPlanPurchaseUrl,
		renewPaidPlanPurchaseUrl,
	] );

	const allActions = useMemo(
		() =>
			hasAdditionalActions ? [ ...additionalActions, getStatusAction() ] : [ getStatusAction() ],
		[ additionalActions, getStatusAction, hasAdditionalActions ]
	);

	const recordDropdownStateChange = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_dropdown_toggle', {
			product: slug,
			state: ! isDropdownOpen ? 'open' : 'closed',
		} );
	}, [ isDropdownOpen, recordEvent, slug ] );

	const onChevronClick = useCallback( () => {
		setIsDropdownOpen( ! isDropdownOpen );
		recordDropdownStateChange();
	}, [ isDropdownOpen, recordDropdownStateChange ] );

	// By default, we set the first "addition action" as the current action shown on the card.
	// If there are none, set it to the status action.
	useEffect( () => {
		setCurrentAction( allActions[ 0 ] );
	}, [ allActions ] );

	// Close the dropdown when clicking outside of it.
	useOutsideAlerter( dropdownRef, e => {
		// Don't need to use outside alerter if chevron is clicked, chevron button will handle it
		if ( ! chevronRef.current.contains( e.target ) ) {
			setIsDropdownOpen( false );
			recordDropdownStateChange();
		}
	} );

	if ( ! admin ) {
		return (
			<Button { ...buttonState } size="small" variant="link" weight="regular">
				{
					/* translators: placeholder is product name. */
					sprintf( __( 'Learn about %s', 'jetpack-my-jetpack' ), name )
				}
			</Button>
		);
	}

	const dropdown = hasAdditionalActions && (
		<div ref={ dropdownRef } className={ styles[ 'action-button-dropdown' ] }>
			<ul className={ styles[ 'dropdown-menu' ] }>
				{ [ ...additionalActions, getStatusAction() ].map( ( { label, isExternalLink }, index ) => {
					const onDropdownMenuItemClick = () => {
						setCurrentAction( allActions[ index ] );
						setIsDropdownOpen( false );

						recordEvent( 'jetpack_myjetpack_product_card_dropdown_action_click', {
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
				<Button { ...buttonState } { ...currentAction }>
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
