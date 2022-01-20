/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

export const PRODUCT_STATUSES = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	ERROR: 'error',
	ABSENT: 'absent',
};

const PRODUCT_STATUSES_LABELS = {
	[ PRODUCT_STATUSES.ACTIVE ]: __( 'Active', 'jetpack-my-jetpack' ),
	[ PRODUCT_STATUSES.INACTIVE ]: __( 'Inactive', 'jetpack-my-jetpack' ),
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

const renderActionButton = ( {
	status,
	admin,
	name,
	onLearn,
	onAdd,
	onManage,
	onFixConnection,
	onActivate,
} ) => {
	if ( ! admin ) {
		return (
			<Button variant="link" onClick={ onLearn }>
				{
					/* translators: placeholder is product name. */
					sprintf( __( 'Learn about %s', 'jetpack-my-jetpack' ), name )
				}
			</Button>
		);
	}

	switch ( status ) {
		case PRODUCT_STATUSES.ABSENT:
			return (
				<Button variant="link" onClick={ onAdd }>
					{
						/* translators: placeholder is product name. */
						sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), name )
					}
				</Button>
			);
		case PRODUCT_STATUSES.ACTIVE:
			return (
				<Button isPressed onClick={ onManage }>
					{ __( 'Manage', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.ERROR:
			return (
				<Button isPressed onClick={ onFixConnection }>
					{ __( 'Fix connection', 'jetpack-my-jetpack' ) }
				</Button>
			);
		case PRODUCT_STATUSES.INACTIVE:
			return (
				<Button isPressed onClick={ onActivate }>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
			);
	}
};

const ProductCard = props => {
	const { name, admin, description, icon, status, onDeactivate } = props;
	const isActive = status === PRODUCT_STATUSES.ACTIVE;
	const isError = status === PRODUCT_STATUSES.ERROR;
	const isInactive = status === PRODUCT_STATUSES.INACTIVE;
	const isAbsent = status === PRODUCT_STATUSES.ABSENT;
	const flagLabel = PRODUCT_STATUSES_LABELS[ status ];
	const canDeactivate = ( isActive || isError ) && admin;

	const containerClassName = classNames( styles.container, {
		[ styles.absent ]: isAbsent,
	} );

	const statusClassName = classNames( styles.status, {
		[ styles.active ]: isActive,
		[ styles.inactive ]: isInactive,
		[ styles.error ]: isError,
	} );

	return (
		<div className={ containerClassName }>
			<div className={ styles.name }>
				<span>{ name }</span>
				{ icon }
			</div>
			<p className={ styles.description }>{ description }</p>
			<div className={ styles.actions }>
				{ canDeactivate ? (
					<ButtonGroup>
						{ renderActionButton( props ) }
						<DropdownMenu
							className={ styles.dropdown }
							toggleProps={ { isPressed: true } }
							popoverProps={ { noArrow: false } }
							icon={ DownIcon }
							controls={ [
								{
									title: __( 'Deactivate', 'jetpack-my-jetpack' ),
									icon: null,
									onClick: onDeactivate,
								},
							] }
						/>
					</ButtonGroup>
				) : (
					renderActionButton( props )
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
	onDeactivate: PropTypes.func,
	onManage: PropTypes.func,
	onFixConnection: PropTypes.func,
	onActivate: PropTypes.func,
	onAdd: PropTypes.func,
	onLearn: PropTypes.func,
	status: PropTypes.oneOf( [
		PRODUCT_STATUSES.ACTIVE,
		PRODUCT_STATUSES.INACTIVE,
		PRODUCT_STATUSES.ERROR,
		PRODUCT_STATUSES.ABSENT,
	] ).isRequired,
};

ProductCard.defaultProps = {
	icon: null,
	onDeactivate: () => {},
	onManage: () => {},
	onFixConnection: () => {},
	onActivate: () => {},
	onAdd: () => {},
	onLearn: () => {},
};

export default ProductCard;
