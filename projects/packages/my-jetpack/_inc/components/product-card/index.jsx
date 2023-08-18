import { Button, Text } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, download } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import ActionButton, { PRODUCT_STATUSES } from './action-button';
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
	items = [],
	showInstall = false,
	onInstall,
	showActivate = false,
	showDeactivate = false,
	onActivate,
	onDeactivate,
} ) => {
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
					{ showInstall && (
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
					{ showActivate && (
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							onClick={ () => {
								onClose();
								onActivate?.();
							} }
						>
							{ __( 'Activate Plugin', 'jetpack-my-jetpack' ) }
						</Button>
					) }
					{ showDeactivate && (
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							onClick={ () => {
								onClose();
								onDeactivate?.();
							} }
						>
							{ __( 'Deactivate Plugin', 'jetpack-my-jetpack' ) }
						</Button>
					) }
				</>
			) }
		/>
	);
};
/* eslint-enable react/jsx-no-bind */

Menu.propTypes = {
	onActivate: PropTypes.func,
	onDeactivate: PropTypes.func,
	showActivate: PropTypes.bool,
	showDeactivate: PropTypes.bool,
	showInstall: PropTypes.bool,
	items: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.string,
			icon: PropTypes.node,
			onClick: PropTypes.func,
		} )
	),
	onInstall: PropTypes.func,
};

Menu.defaultProps = {
	onActivate: () => {},
	onDeactivate: () => {},
	showActivate: false,
	showDeactivate: false,
};

const ProductCard = props => {
	const {
		name,
		description,
		status,
		onActivate,
		isFetching,
		isInstallingStandalone,
		isDeactivatingStandalone,
		slug,
		children,
		// Menu Related
		showMenu = false,
		showActivateOption = false,
		showDeactivateOption = false,
		showInstallOption = false,
		menuItems = [],
		onInstallStandalone,
		onActivateStandalone,
		onDeactivateStandalone,
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
		[ styles[ 'is-fetching' ] ]: isFetching || isInstallingStandalone || isDeactivatingStandalone,
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
	const addHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_add_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const manageHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Calls the passed function onManage after firing Tracks event
	 */
	const fixConnectionHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_fixconnection_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

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

	/**
	 * Use a Tracks event to count a standalone plugin deactivation menu click
	 */
	const deactivateStandaloneHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_deactivate_standalone_plugin_click', {
			product: slug,
		} );
		onDeactivateStandalone();
	}, [ slug, onDeactivateStandalone, recordEvent ] );

	return (
		<div className={ containerClassName }>
			<div className={ styles.title }>
				<div className={ styles.name }>
					<Text variant="title-medium">{ name }</Text>
				</div>
				{ showMenu && (
					<Menu
						items={ menuItems }
						showActivate={ showActivateOption }
						showDeactivate={ showDeactivateOption }
						onActivate={ activateStandaloneHandler }
						onDeactivate={ deactivateStandaloneHandler }
						showInstall={ showInstallOption }
						onInstall={ installStandaloneHandler }
					/>
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
					onAdd={ addHandler }
					className={ styles.button }
				/>
				{ ! isAbsent && (
					<Text variant="label" className={ statusClassName }>
						{ flagLabel }
					</Text>
				) }
			</div>
		</div>
	);
};

ProductCard.propTypes = {
	children: PropTypes.node,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	isInstallingStandalone: PropTypes.bool,
	isDeactivatingStandalone: PropTypes.bool,
	isManageDisabled: PropTypes.bool,
	onActivate: PropTypes.func,
	slug: PropTypes.string.isRequired,
	showMenu: PropTypes.bool,
	showActivateOption: PropTypes.bool,
	showDeactivateOption: PropTypes.bool,
	showInstallOption: PropTypes.bool,
	menuItems: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.string,
			icon: PropTypes.node,
			onClick: PropTypes.func,
		} )
	),
	onInstallStandalone: PropTypes.func,
	onActivateStandalone: PropTypes.func,
	onDeactivateStandalone: PropTypes.func,
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
	isFetching: false,
	isInstallingStandalone: false,
	isDeactivatingStandalone: false,
	onActivate: () => {},
	showMenu: false,
	showActivateOption: false,
	showDeactivateOption: false,
	showInstallOption: false,
	menuItems: [],
};

export { PRODUCT_STATUSES };
export default ProductCard;
