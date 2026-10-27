import clsx from 'clsx';
import {
	connectionStatusCloud as cloud,
	connectionStatusEmptyAvatar as emptyAvatar,
	connectionStatusJetpackGray as jetpackGray,
	connectionStatusJetpack as jetpack,
} from '../../assets/inline-svgs';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import styles from './connection-status.module.scss';
import type { ConnectionState } from '../../hooks/use-connection-state';
import type { FC } from 'react';

type ConnectionStatusProps = {
	status: ConnectionState[ 'status' ];
	/** Whether to draw the account beside Jetpack: the viewer's avatar, or an empty one. */
	showAvatar: boolean;
	className?: string;
};

/**
 * Jetpack, the account, a line coloured by the connection's status, and WordPress.com.
 *
 * @param props            - Component props.
 * @param props.status     - The connection's status.
 * @param props.showAvatar - Whether to draw the account.
 * @param props.className  - Extra class for the wrapper.
 * @return The illustration.
 */
export const ConnectionStatus: FC< ConnectionStatusProps > = ( {
	status,
	showAvatar,
	className,
} ) => {
	const { isRegistered, isUserConnected, userConnectionData } = useMyJetpackConnection();
	const avatar = userConnectionData.currentUser?.wpcomUser?.avatar;

	return (
		<div className={ clsx( styles.status, className ) }>
			<div className={ styles[ 'avatar-wrapper' ] }>
				<img src={ isRegistered ? jetpack : jetpackGray } alt="" className={ styles.jetpack } />
				{ showAvatar && (
					<img
						src={ isUserConnected && avatar ? avatar : emptyAvatar }
						alt=""
						className={ styles.avatar }
					/>
				) }
			</div>
			<div className={ clsx( styles.line, styles[ status ] ) } />
			<img src={ cloud } alt="" className={ styles.cloud } />
		</div>
	);
};
