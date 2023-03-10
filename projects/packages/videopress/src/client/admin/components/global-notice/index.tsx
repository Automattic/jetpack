/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
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
	actions: Array< {
		label: string;
		onClick: () => void;
		variant: string;
		noDefaultClasses: boolean;
	} >;
	addConnectUserLink?: boolean | string;
	onRemove?: () => void;
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
 * @param {string} props.className            - Additional class name
 * @param {Function} props.onRemove           - Callback when the notice is removed
 * @param {React.ReactNode} props.children    - Notice content
 * @param {Array} props.actions               - Notice actions
 * @returns {React.ReactElement}                Component template
 */
export default function GlobalNotice( {
	status = 'error',
	isDismissible = false,
	className,
	children,
	actions,
	onRemove,
}: GlobalNoticeProps ): React.ReactElement {
	const classes = classnames( className, styles.notice, styles[ `is-${ status }` ] );

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

export const NeedUserConnectionGlobalNotice = () => {
	const { adminUri, registrationNonce } = window.jetpackVideoPressInitialState;

	const { hasConnectedOwner, handleRegisterSite } = useConnection( {
		redirectUri: adminUri,
		from: 'jetpack-videopress',
		registrationNonce,
	} );

	if ( hasConnectedOwner ) {
		return null;
	}

	return (
		<GlobalNotice
			addConnectUserLink={ true }
			actions={ [
				{
					label: __( 'Connect your user account to fix this', 'jetpack-videopress-pkg' ),
					onClick: handleRegisterSite,
					variant: 'link',
					noDefaultClasses: true,
				},
			] }
		>
			{ __(
				'Some actions need a user connection to WordPress.com to be able to work',
				'jetpack-videopress-pkg'
			) }
		</GlobalNotice>
	);
};
