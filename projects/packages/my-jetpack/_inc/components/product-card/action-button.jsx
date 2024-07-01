import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown, external, check } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useProduct from '../../data/products/use-product';
import useAnalytics from '../../hooks/use-analytics';
import useOutsideAlerter from '../../hooks/use-outside-alerter';
import styles from './style.module.scss';

const ActionButton = ( {
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
} ) => {
	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
	const [ currentAction, setCurrentAction ] = useState( {} );
	const { detail } = useProduct( slug );
	const { manageUrl, purchaseUrl } = detail;
	const isManageDisabled = ! manageUrl;
	const dropdownRef = useRef( null );
	const chevronRef = useRef( null );
	const { recordEvent } = useAnalytics();

	const isBusy = isFetching || isInstallingStandalone;
	const hasAdditionalActions = additionalActions?.length > 0;

	const buttonState = useMemo( () => {
		return {
			variant: ! isBusy ? 'primary' : undefined,
			disabled: isBusy,
			className,
		};
	}, [ isBusy, className ] );

	const getStatusAction = useCallback( () => {
		switch ( status ) {
			case PRODUCT_STATUSES.ABSENT: {
				const buttonText = __( 'Learn more', 'jetpack-my-jetpack' );
				return {
					...buttonState,
					href: `#/add-${ slug }`,
					size: 'small',
					variant: 'primary',
					weight: 'regular',
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
					href: '',
					size: 'small',
					variant: 'primary',
					weight: 'regular',
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
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ] ),
				};
			case PRODUCT_STATUSES.NEEDS_PURCHASE: {
				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.NEEDS_PURCHASE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.NEEDS_PURCHASE ] ),
				};
			}
			case PRODUCT_STATUSES.CAN_UPGRADE: {
				const upgradeText = __( 'Upgrade', 'jetpack-my-jetpack' );
				const purchaseText = __( 'Learn more', 'jetpack-my-jetpack' );
				const buttonText = purchaseUrl || upgradeInInterstitial ? upgradeText : purchaseText;

				return {
					...buttonState,
					href: purchaseUrl || `#/add-${ slug }`,
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: buttonText,
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.CAN_UPGRADE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.CAN_UPGRADE ] ),
				};
			}
			case PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE:
				return {
					...buttonState,
					href: `#/add-${ slug }`,
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onAdd,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ] ),
				};
			case PRODUCT_STATUSES.ACTIVE: {
				const buttonText = __( 'View', 'jetpack-my-jetpack' );

				return {
					...buttonState,
					disabled: isManageDisabled || buttonState?.disabled,
					href: manageUrl,
					size: 'small',
					variant: 'secondary',
					weight: 'regular',
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
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: __( 'Fix connection', 'jetpack-my-jetpack' ),
					onClick: onFixConnection,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.ERROR in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.ERROR ] ),
				};
			case PRODUCT_STATUSES.USER_CONNECTION_ERROR:
				return {
					href: '#/connection',
					size: 'small',
					variant: 'primary',
					weight: 'regular',
					label: __( 'Connect', 'jetpack-my-jetpack' ),
					onClick: onFixConnection,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.USER_CONNECTION_ERROR in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ] ),
				};
			case PRODUCT_STATUSES.INACTIVE:
			case PRODUCT_STATUSES.MODULE_DISABLED:
				return {
					...buttonState,
					href: '',
					size: 'small',
					variant: 'secondary',
					weight: 'regular',
					label: __( 'Activate', 'jetpack-my-jetpack' ),
					onClick: onActivate,
					...( primaryActionOverride &&
						PRODUCT_STATUSES.INACTIVE in primaryActionOverride &&
						primaryActionOverride[ PRODUCT_STATUSES.INACTIVE ] ),
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
