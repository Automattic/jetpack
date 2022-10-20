/**
 * External dependencies
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning, info, check } from '@wordpress/icons';
import classnames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

type NoticeStatusProp = 'success' | 'info' | 'warning' | 'error';

type GlobalNoticeProps = {
	status?: NoticeStatusProp;
	isDismissible?: boolean;
	className?: string;
	children: React.ReactNode;

	addConnectUserLink?: boolean | string;

	onRemove?: () => void;
	onConnectUserClick?: () => void;
};

const getIconByLevel = ( level: NoticeStatusProp ) => {
	switch ( level ) {
		case 'error':
			return warning;
		case 'warning':
			return warning;
		case 'info':
			return info;
		case 'success':
			return check;
		default:
			return warning;
	}
};

/**
 * VideoPress Logo component
 *
 * @param {object} props                      - Component props
 * @param {NoticeStatusProp} props.status     - Notice status severity
 * @param {boolean} props.isDismissible       - Whether the notice is dismissible
 * @param {boolean} props.addConnectUserLink  - Add a link to connect the user.                                            If a string is passed, it will be used as the link text.
 * @param {string} props.className            - Additional class name
 * @param {Function} props.onRemove           - Callback when the notice is removed
 * @param {Function} props.onConnectUserClick - Callback when the connect user button is clicked
 * @param {React.ReactNode} props.children    - Notice content
 * @returns {React.ReactElement}                Component template
 */
export default function GlobalNotice( {
	status = 'error',
	isDismissible = false,
	className,
	children,

	addConnectUserLink = false,

	onRemove,
	onConnectUserClick,
}: GlobalNoticeProps ): React.ReactElement {
	const actions = [];
	const classes = classnames( className, styles.notice, styles[ `is-${ status }` ] );

	if ( addConnectUserLink ) {
		actions.push( {
			label:
				typeof addConnectUserLink !== 'string'
					? __( 'Connect your user account to fix this', 'jetpack-videopress-pkg' )
					: addConnectUserLink,
			onClick: onConnectUserClick,
			variant: 'link',
			noDefaultClasses: true,
		} );
	}

	return (
		<Notice
			status={ status }
			isDismissible={ isDismissible }
			onRemove={ onRemove }
			className={ classes }
			actions={ actions }
		>
			<Icon icon={ getIconByLevel( status ) } className={ styles.icon } />
			<div className={ styles.message }>{ children }</div>
		</Notice>
	);
}
