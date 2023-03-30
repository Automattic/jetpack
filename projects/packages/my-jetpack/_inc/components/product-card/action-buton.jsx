import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'plugin_absent',
	NEEDS_PURCHASE: 'needs_purchase',
	NEEDS_PURCHASE_OR_FREE: 'needs_purchase_or_free',
};

const ActionButton = ( {
	status,
	admin,
	name,
	onActivate,
	onManage,
	onFixConnection,
	isFetching,
	className,
	onAdd,
} ) => {
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

	const buttonState = {
		variant: ! isFetching ? 'primary' : undefined,
		disabled: isFetching,
		className,
	};

	switch ( status ) {
		case PRODUCT_STATUSES.ABSENT:
			return (
				<Button { ...buttonState } size="small" variant="link" weight="regular">
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), name )
					}
				</Button>
			);
		case PRODUCT_STATUSES.NEEDS_PURCHASE:
			return (
				<Button { ...buttonState } size="small" weight="regular" onClick={ onAdd }>
					{ __( 'Purchase', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE:
			return (
				<Button { ...buttonState } size="small" weight="regular" onClick={ onAdd }>
					{ __( 'Start for free', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ACTIVE:
			return (
				<Button
					{ ...buttonState }
					size="small"
					weight="regular"
					variant="secondary"
					onClick={ onManage }
				>
					{ __( 'Manage', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ERROR:
			return (
				<Button { ...buttonState } size="small" weight="regular" onClick={ onFixConnection }>
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
