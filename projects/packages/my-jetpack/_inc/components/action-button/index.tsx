import { __ } from '@wordpress/i18n';
import { Icon, chevronDown, external, check } from '@wordpress/icons';
import { Badge } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useOutsideAlerter from '../../hooks/use-outside-alerter';
import SecondaryButton, { type SecondaryButtonProps } from './secondary-button';
import styles from './style.module.scss';
import useProductStatusAction from './use-product-status-action';
import type { AdditionalAction } from './types';
import type { FC, MouseEvent, SetStateAction } from 'react';

const getActionButtonId = ( productSlug: string ) => `action-button-label-${ productSlug }`;

type ActionButtonProps = {
	slug: JetpackModule;
	additionalActions?: AdditionalAction[];
	primaryActionOverride?: Record< string, AdditionalAction >;
	fixSiteConnectionHandler?: ( e: MouseEvent< HTMLButtonElement > ) => void;
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
	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );
	const [ currentAction, setCurrentAction ] = useState< SecondaryButtonProps >( {} );
	const dropdownRef = useRef( null );
	const chevronRef = useRef( null );
	const { recordEvent } = useAnalytics();
	const { action, isBusy, forcedOffReason } = useProductStatusAction( slug, {
		primaryActionOverride,
		fixSiteConnectionHandler,
		tracksIdentifier,
	} );

	const hasAdditionalActions = additionalActions?.length > 0;
	const labelledBy = `${ getActionButtonId( slug ) } ${ labelSuffixId || '' }`.trim();

	const buttonState = useMemo< Partial< SecondaryButtonProps > >( () => {
		return {
			variant: 'primary',
			size: 'compact',
			isLoading: isBusy,
			loadingAnnouncement: __( 'Loading…', 'jetpack-my-jetpack' ),
			className,
		};
	}, [ isBusy, className ] );

	const statusAction: SecondaryButtonProps = useMemo(
		() => ( { ...buttonState, 'aria-labelledby': labelledBy, ...action } ),
		[ buttonState, labelledBy, action ]
	);

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

	// Activating or buying a feature the host keeps off changes nothing, so say why instead.
	if ( forcedOffReason ) {
		return (
			<Badge intent="medium" className={ styles[ 'forced-off-reason' ] }>
				{ forcedOffReason }
			</Badge>
		);
	}

	return (
		<>
			<div
				className={ clsx(
					styles[ 'action-button' ],
					hasAdditionalActions ? styles[ 'has-additional-actions' ] : null
				) }
			>
				<SecondaryButton { ...buttonState } { ...currentAction } id={ getActionButtonId( slug ) } />
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
