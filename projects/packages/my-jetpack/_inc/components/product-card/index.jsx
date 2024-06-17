import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useCallback, useEffect } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import useAnalytics from '../../hooks/use-analytics';
import Card from '../card';
import ActionButton from './action-button';
import Status from './status';
import styles from './style.module.scss';

export const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.MODULE_DISABLED ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ABSENT ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ]: __( 'Needs Plugin', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ]: __( 'Inactive', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ]: __( 'Needs user account', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ]: __( 'Needs connection', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.CAN_UPGRADE ]: __( 'Active', 'jetpack-my-jetpack' ),
};

// SecondaryButton component
const SecondaryButton = props => {
	const {
		shouldShowButton = () => true,
		positionFirst,
		...buttonProps
	} = {
		size: 'small',
		variant: 'secondary',
		weight: 'regular',
		label: __( 'Learn more', 'jetpack-my-jetpack' ),
		...props,
	};

	if ( ! shouldShowButton() ) {
		return false;
	}

	return <Button { ...buttonProps }>{ buttonProps.label }</Button>;
};

SecondaryButton.propTypes = {
	href: PropTypes.string,
	size: PropTypes.oneOf( [ 'normal', 'small' ] ),
	variant: PropTypes.oneOf( [ 'primary', 'secondary', 'link', 'tertiary' ] ),
	weight: PropTypes.oneOf( [ 'bold', 'regular' ] ),
	label: PropTypes.string,
	shouldShowButton: PropTypes.func,
	onClick: PropTypes.func,
	positionFirst: PropTypes.bool,
	isExternalLink: PropTypes.bool,
	icon: PropTypes.node,
	iconSize: PropTypes.number,
	disabled: PropTypes.bool,
	isLoading: PropTypes.bool,
	className: PropTypes.string,
};

// ProductCard component
const ProductCard = inprops => {
	const props = {
		isFetching: false,
		isInstallingStandalone: false,
		onActivate: () => {},
		...inprops,
	};
	const {
		name,
		Description,
		status,
		onActivate,
		isFetching,
		isDataLoading,
		isInstallingStandalone,
		slug,
		additionalActions,
		primaryActionOverride,
		secondaryAction,
		children,
		onInstallStandalone,
		onMouseEnter,
		onMouseLeave,
	} = props;

	const isError = status === PRODUCT_STATUSES.ERROR;
	const isAbsent =
		status === PRODUCT_STATUSES.ABSENT || status === PRODUCT_STATUSES.ABSENT_WITH_PLAN;
	const isPurchaseRequired =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE ||
		status === PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE;

	const containerClassName = clsx( {
		[ styles.plugin_absent ]: isAbsent,
		[ styles[ 'is-purchase-required' ] ]: isPurchaseRequired,
		[ styles[ 'is-link' ] ]: isAbsent,
		[ styles[ 'has-error' ] ]: isError,
	} );

	const { recordEvent } = useAnalytics();

	/**
	 * Calls the passed function onActivate after firing Tracks event
	 */
	const activateHandler = useCallback(
		event => {
			event.preventDefault();
			recordEvent( 'jetpack_myjetpack_product_card_activate_click', {
				product: slug,
			} );
			onActivate();
		},
		[ slug, onActivate, recordEvent ]
	);

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
	 * Calls when the "Learn more" button is clicked
	 */
	const learnMoreHandler = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_card_learnmore_click', {
			product: slug,
		} );
	}, [ slug, recordEvent ] );

	/**
	 * Use a Tracks event to count a standalone plugin install request
	 */
	const installStandaloneHandler = useCallback(
		event => {
			event.preventDefault();
			recordEvent( 'jetpack_myjetpack_product_card_install_standalone_plugin_click', {
				product: slug,
			} );
			onInstallStandalone();
		},
		[ slug, onInstallStandalone, recordEvent ]
	);

	/**
	 * Sends an event when the card loads
	 */
	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_card_loaded', {
			product: slug,
			status: status,
		} );
	}, [ recordEvent, slug, status ] );

	return (
		<Card
			title={ name }
			className={ clsx( styles.container, containerClassName ) }
			headerRightContent={ null }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
		>
			<Description />

			{ isDataLoading ? (
				<span className={ styles.loading }>{ __( 'Loading…', 'jetpack-my-jetpack' ) }</span>
			) : (
				children
			) }

			<div className={ styles.actions }>
				<div className={ styles.buttons }>
					{ secondaryAction && secondaryAction?.positionFirst && (
						<SecondaryButton { ...secondaryAction } />
					) }
					<ActionButton
						{ ...props }
						onActivate={ activateHandler }
						onFixConnection={ fixConnectionHandler }
						onManage={ manageHandler }
						onAdd={ addHandler }
						onInstall={ installStandaloneHandler }
						onLearnMore={ learnMoreHandler }
						className={ styles.button }
						additionalActions={ additionalActions }
						primaryActionOverride={ primaryActionOverride }
					/>
					{ secondaryAction && ! secondaryAction?.positionFirst && (
						<SecondaryButton { ...secondaryAction } />
					) }
				</div>
				<Status
					status={ status }
					isFetching={ isFetching }
					isInstallingStandalone={ isInstallingStandalone }
				/>
			</div>
		</Card>
	);
};

ProductCard.propTypes = {
	children: PropTypes.node,
	name: PropTypes.string.isRequired,
	Description: PropTypes.func.isRequired,
	admin: PropTypes.bool.isRequired,
	isFetching: PropTypes.bool,
	isInstallingStandalone: PropTypes.bool,
	isManageDisabled: PropTypes.bool,
	onActivate: PropTypes.func,
	slug: PropTypes.string.isRequired,
	additionalActions: PropTypes.array,
	primaryActionOverride: PropTypes.object,
	secondaryAction: PropTypes.object,
	onInstallStandalone: PropTypes.func,
	onActivateStandalone: PropTypes.func,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.SITE_CONNECTION_ERROR,
		PRODUCT_STATUSES.ABSENT,
		PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		PRODUCT_STATUSES.NEEDS_PURCHASE,
		PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE,
		PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION,
		PRODUCT_STATUSES.USER_CONNECTION_ERROR,
		PRODUCT_STATUSES.CAN_UPGRADE,
		PRODUCT_STATUSES.MODULE_DISABLED,
	] ).isRequired,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
};

export { PRODUCT_STATUSES };
export default ProductCard;
