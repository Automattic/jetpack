import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { useProduct } from '../../hooks/use-product';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'plugin_absent',
	ABSENT_WITH_PLAN: 'plugin_absent_with_plan',
	NEEDS_PURCHASE: 'needs_purchase',
	NEEDS_PURCHASE_OR_FREE: 'needs_purchase_or_free',
};

const ActionButton = ( {
	status,
	admin,
	name,
	slug,
	onActivate,
	onManage,
	onFixConnection,
	isFetching,
	isInstallingStandalone,
	isDeactivatingStandalone,
	className,
	onAdd,
} ) => {
	const { detail } = useProduct( slug );
	const { manageUrl, purchaseUrl } = detail;
	const isManageDisabled = ! manageUrl;

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

	const isBusy = isFetching || isInstallingStandalone || isDeactivatingStandalone;

	const buttonState = {
		variant: ! isBusy ? 'primary' : undefined,
		disabled: isBusy,
		className,
	};

	switch ( status ) {
		case PRODUCT_STATUSES.ABSENT:
		case PRODUCT_STATUSES.ABSENT_WITH_PLAN:
			return (
				<Button
					{ ...buttonState }
					href={ `#/add-${ slug }` }
					size="small"
					variant="link"
					weight="regular"
				>
					{ status === PRODUCT_STATUSES.ABSENT &&
						sprintf(
							/* translators: placeholder is product name. */
							__( 'Get %s', 'jetpack-my-jetpack' ),
							name
						) }
					{ status === PRODUCT_STATUSES.ABSENT_WITH_PLAN &&
						sprintf(
							/* translators: placeholder is product name. */
							__( 'Install %s', 'jetpack-my-jetpack' ),
							name
						) }
				</Button>
			);
		case PRODUCT_STATUSES.NEEDS_PURCHASE: {
			const upgradeText = __( 'Upgrade', 'jetpack-my-jetpack' );
			const purchaseText = __( 'Purchase', 'jetpack-my-jetpack' );
			const buttonText = purchaseUrl ? upgradeText : purchaseText;
			return (
				<Button
					{ ...buttonState }
					href={ purchaseUrl || `#/add-${ slug }` }
					size="small"
					weight="regular"
					onClick={ onAdd }
				>
					{ buttonText }
				</Button>
			);
		}
		case PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE:
			return (
				<Button
					{ ...buttonState }
					href={ `#/add-${ slug }` }
					size="small"
					weight="regular"
					onClick={ onAdd }
				>
					{ __( 'Start for free', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ACTIVE: {
			const viewText = __( 'View', 'jetpack-my-jetpack' );
			const manageText = __( 'Manage', 'jetpack-my-jetpack' );
			const buttonText = purchaseUrl ? viewText : manageText;
			return (
				<Button
					{ ...buttonState }
					disabled={ isManageDisabled || buttonState?.disabled }
					size="small"
					weight="regular"
					variant="secondary"
					href={ manageUrl }
					onClick={ onManage }
				>
					{ buttonText }
				</Button>
			);
		}
		case PRODUCT_STATUSES.ERROR:
			return (
				<Button
					{ ...buttonState }
					href="#/connection"
					size="small"
					weight="regular"
					onClick={ onFixConnection }
				>
					{ __( 'Fix connection', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.INACTIVE:
			return (
				<Button
					{ ...buttonState }
					size="small"
					weight="regular"
					variant="secondary"
					onClick={ onActivate }
				>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
			);

		default:
			return null;
	}
};

export default ActionButton;
