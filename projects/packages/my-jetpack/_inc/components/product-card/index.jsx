import { Button, Text } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external, moreVertical, download, check } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import ActionButton, { PRODUCT_STATUSES } from './action-buton';
import styles from './style.module.scss';

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
};

/* eslint-disable react/jsx-no-bind */
const Menu = ( {
	productStatus,
	items = [],
	onManage,
	onInstall,
	onActivate,
	hasStandalonePlugin,
	isStandaloneInstalled,
	isStandaloneActive,
} ) => {
	/**
	 * Only show standalone related option if plugin is not installed
	 * or the plugin is not active
	 */
	const showStandaloneOption =
		hasStandalonePlugin && ( ! isStandaloneInstalled || ! isStandaloneActive );

	return (
		<Dropdown
			className={ styles.dropdown }
			popoverProps={ { noArrow: false, placement: 'bottom-end' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					variant="tertiary"
					size="small"
					icon={ moreVertical }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					{ items.map( item => (
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ item?.icon }
							onClick={ () => {
								onClose();
								item?.onClick?.();
							} }
						>
							{ item?.label }
						</Button>
					) ) }
					{ productStatus === PRODUCT_STATUSES.ACTIVE && (
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ external }
							onClick={ () => {
								onClose();
								onManage?.();
							} }
						>
							{ __( 'Manage', 'jetpack-my-jetpack' ) }
						</Button>
					) }
					{ showStandaloneOption && (
						<>
							{ ( productStatus === PRODUCT_STATUSES.ACTIVE || items.length > 0 ) && <hr /> }
							{ ! isStandaloneInstalled && (
								<Button
									weight="regular"
									fullWidth
									variant="tertiary"
									icon={ download }
									onClick={ () => {
										onClose();
										onInstall?.();
									} }
								>
									{ __( 'Install Plugin', 'jetpack-my-jetpack' ) }
								</Button>
							) }
							{ isStandaloneInstalled && ! isStandaloneActive && (
								<Button
									weight="regular"
									fullWidth
									variant="tertiary"
									icon={ check }
									onClick={ () => {
										onClose();
										onActivate?.();
									} }
								>
									{ __( 'Activate Plugin', 'jetpack-my-jetpack' ) }
								</Button>
							) }
						</>
					) }
				</>
			) }
		/>
	);
};
/* eslint-enable react/jsx-no-bind */

const ProductCard = props => {
	const {
		name,
		description,
		icon,
		status,
		onActivate,
		onAdd,
		onFixConnection,
		onManage,
		isFetching,
		slug,
		children,
		showMenu = false,
		menuItems = [],
		onInstallStandalone,
		onActivateStandalone,
		hasStandalonePlugin = false,
		isStandaloneInstalled = false,
		isStandaloneActive = false,
	} = props;
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];

	// If status is absent, we disable the menu
	const menuIsActive =
		showMenu && // The menu is enabled for the product AND
		! isAbsent && // product status is not absent AND
		( isActive || // product is active, show at least the Manage option
			menuItems?.length > 0 || // Show custom menus, if present
			( hasStandalonePlugin && ( ! isStandaloneActive || ! isStandaloneInstalled ) ) ); // Show install | activate options for standalone plugin

	const containerClassName = classNames( styles.container, {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
	} );

	const statusClassName = classNames( styles.status, {
		[ styles.active ]: isActive,
		[ styles.inactive ]: isInactive || isPurchaseRequired,
		[ styles.error ]: isError,
		[ styles[ 'is-fetching' ] ]: isFetching,
	} );

	const { recordEvent } = useAnalytics();

	/**
	 * Calls the passed function onActivate after firing Tracks event
	 */
	const activateHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_activate_click', {
			product: slug,
		} );
		onActivate();
	}, [ slug, onActivate, recordEvent ] );

	/**
	 * Calls the passed function onAdd after firing Tracks event
	 */
	const addHandler = useCallback(
		ev => {
			if ( ev?.preventDefault ) {
				ev.preventDefault();
			}

			recordEvent( 'jetpack_myjetpack_product_card_add_click', {
				product: slug,
			} );
			onAdd();
		},
		[ slug, onAdd, recordEvent ]
	);

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
		onManage();
	}, [ slug, onManage, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const fixConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
		onFixConnection();
	}, [ slug, onFixConnection, recordEvent ] );

	/**
	 * Use a Tracks event to count a standalone plugin install request
	 */
	const installStandaloneHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_install_standalone_plugin_click', {
			product: slug,
		} );
		onInstallStandalone();
	}, [ slug, onInstallStandalone, recordEvent ] );

	/**
	 * Use a Tracks event to count a standalone plugin activation request
	 */
	const activateStandaloneHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_activate_standalone_plugin_click', {
			product: slug,
		} );
		onActivateStandalone();
	}, [ slug, onActivateStandalone, recordEvent ] );

	const CardWrapper = isAbsent
		? ( { children: wrapperChildren, ...cardProps } ) => (
				<a { ...cardProps } href="#" onClick={ addHandler }>
					{ wrapperChildren }
				</a>
		  )
		: ( { children: wrapperChildren, ...cardProps } ) => (
				<div { ...cardProps }>{ wrapperChildren }</div>
		  );

	return (
		<CardWrapper className={ containerClassName }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ name }</Text>
					{ menuIsActive && icon }
				</div>
				{ menuIsActive ? (
					<Menu
						productStatus={ status }
						items={ menuItems }
						onManage={ onManage }
						onInstall={ installStandaloneHandler }
						onActivate={ activateStandaloneHandler }
						hasStandalonePlugin={ hasStandalonePlugin }
						isStandaloneActive={ isStandaloneActive }
						isStandaloneInstalled={ isStandaloneInstalled }
					/>
				) : (
					icon
				) }
			</div>
			{
				// If is not active, no reason to use children
				// Since we want user to take action if isn't active
				isActive && children ? (
					children
				) : (
					<Text variant="body-small" className={ styles.description }>
						{ description }
					</Text>
				)
			}
			<div className={ styles.actions }>
				<ActionButton
					{ ...props }
					onActivate={ activateHandler }
					onFixConnection={ fixConnectionHandler }
					onManage={ manageHandler }
					className={ styles.button }
				/>
				{ ! isAbsent && (
					<Text variant="label" className={ statusClassName }>
						{ flagLabel }
					</Text>
				) }
			</div>
		</CardWrapper>
	);
};

ProductCard.propTypes = {
	children: PropTypes.node,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.element,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	onManage: PropTypes.func,
	onFixConnection: PropTypes.func,
	onActivate: PropTypes.func,
	onAdd: PropTypes.func,
	slug: PropTypes.string.isRequired,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		PRODUCT_STATUSES.NEEDS_PURCHASE,
		PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE,
	] ).isRequired,
};

ProductCard.defaultProps = {
	icon: null,
	isFetching: false,
	onManage: () => {},
	onFixConnection: () => {},
	onActivate: () => {},
	onAdd: () => {},
};

export { PRODUCT_STATUSES };
export default ProductCard;
