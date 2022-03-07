/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import useAnalytics from '../../hooks/use-analytics';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'plugin_absent',
	NEEDS_PURCHASE: 'needs_purchase',
};

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ERROR ]: __( 'Error', 'jetpack-my-jetpack' ),
};

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
			fill="#fff"
		/>
	</svg>
);

const ActionButton = ( {
	status,
	admin,
	name,
	onLearn,
	onActivate,
	onAdd,
	onManage,
	onFixConnection,
	isFetching,
} ) => {
	if ( ! admin ) {
		return (
			<Button isLink onClick={ onLearn } className={ styles[ 'action-link-button' ] }>
				{
					/* translators: placeholder is product name. */
					sprintf( __( 'Learn about %s', 'jetpack-my-jetpack' ), name )
				}
			</Button>
		);
	}

	const buttonState = {
		isPrimary: ! isFetching,
		disabled: isFetching,
	};

	switch ( status ) {
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
		case PRODUCT_STATUSES.ABSENT:
			return (
				<Button isLink onClick={ onAdd } className={ styles[ 'action-link-button' ] }>
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), name )
					}
				</Button>
			);
		case PRODUCT_STATUSES.ACTIVE:
			return (
				<Button { ...buttonState } onClick={ onManage }>
					{ __( 'Manage', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ERROR:
			return (
				<Button { ...buttonState } onClick={ onFixConnection }>
					{ __( 'Fix connection', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.INACTIVE:
			return (
				<Button { ...buttonState } onClick={ onActivate }>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
			);

		default:
			return null;
	}
};

const ProductCard = props => {
	const {
		name,
		admin,
		description,
		icon,
		status,
		onActivate,
		onAdd,
		onDeactivate,
		onFixConnection,
		onManage,
		isFetching,
		slug,
		showDeactivate,
	} = props;
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isAbsent = status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.NEEDS_PURCHASE;
	const isPurchaseRequired = status === PRODUCT_STATUSES.NEEDS_PURCHASE;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];
	const canDeactivate = ( isActive || isError ) && admin && showDeactivate;

	const containerClassName = classNames( styles.container, {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
	} );

	const statusClassName = classNames( styles.status, {
		[ styles.active ]: isActive,
		[ styles.inactive ]: isInactive,
		[ styles.error ]: isError,
		[ styles[ 'is-fetching' ] ]: isFetching,
	} );

	const { recordEvent } = useAnalytics();

	/**
	 * Calls the passed function onDeactivate after firing Tracks event
	 */
	const deactivateHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_deactivate_click', {
			product: slug,
		} );
		onDeactivate();
	}, [ slug, onDeactivate, recordEvent ] );

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
		onAdd();
	}, [ slug, onAdd, recordEvent ] );

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

	return (
		<div className={ containerClassName }>
			<div className={ styles.name }>
				<span>{ name }</span>
				{ icon }
			</div>
			<p className={ styles.description }>{ description }</p>
			<div className={ styles.actions }>
				{ canDeactivate ? (
					<ButtonGroup className={ styles.group }>
						<ActionButton
							{ ...props }
							onActivate={ activateHandler }
							onFixConnection={ fixConnectionHandler }
							onManage={ manageHandler }
						/>
						<DropdownMenu
							className={ styles.dropdown }
							toggleProps={ { isPrimary: true, disabled: isFetching } }
							popoverProps={ { noArrow: false } }
							icon={ DownIcon }
							disableOpenOnArrowDown={ true }
							controls={ [
								{
									title: __( 'Deactivate', 'jetpack-my-jetpack' ),
									icon: null,
									onClick: deactivateHandler,
								},
							] }
						/>
					</ButtonGroup>
				) : (
					<ActionButton
						{ ...props }
						onFixConnection={ fixConnectionHandler }
						onActivate={ activateHandler }
						onAdd={ addHandler }
					/>
				) }
				{ ! isAbsent && <div className={ statusClassName }>{ flagLabel }</div> }
			</div>
		</div>
	);
};

ProductCard.propTypes = {
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.element,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	onDeactivate: PropTypes.func,
	onManage: PropTypes.func,
	onFixConnection: PropTypes.func,
	onActivate: PropTypes.func,
	onAdd: PropTypes.func,
	onLearn: PropTypes.func,
	slug: PropTypes.string.isRequired,
	showDeactivate: PropTypes.bool,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.NEEDS_PURCHASE,
	] ).isRequired,
};

ProductCard.defaultProps = {
	icon: null,
	isFetching: false,
	onDeactivate: () => {},
	onManage: () => {},
	onFixConnection: () => {},
	onActivate: () => {},
	onAdd: () => {},
	onLearn: () => {},
	showDeactivate: true,
};

export default ProductCard;
