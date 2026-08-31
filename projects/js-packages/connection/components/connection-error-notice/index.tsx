import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { getReconnectErrorMessage } from '../../helpers/get-reconnect-error-message';
import styles from './styles.module.scss';
import type { ConnectionErrorNoticeProps } from './types';
import type { ReactNode } from 'react';

const ConnectionErrorNotice = ( {
	message,
	context,
	isRestoringConnection,
	restoreConnectionCallback,
	restoreConnectionError,
	actions = [],
}: ConnectionErrorNoticeProps ) => {
	if ( ! message ) {
		return null;
	}

	if ( isRestoringConnection ) {
		// During reconnect, hide the intent icon so only the spinner is shown. The
		// stable `key` makes React remount the `@wordpress/ui` Notice when switching
		// states, preventing a hook order issue from component reuse.
		return (
			<Notice.Root key="reconnecting" intent="error" icon={ null }>
				<Notice.Description className={ styles.message }>
					<Spinner />
					{ __( 'Reconnecting Jetpack', 'jetpack-connection-js' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	const errorRender = restoreConnectionError ? (
		<Notice.Root key="restore-error" intent="error" className={ styles.error }>
			<Notice.Description>
				{ getReconnectErrorMessage( restoreConnectionError ) }
			</Notice.Description>
		</Notice.Root>
	) : null;

	// Determine which actions to show.
	let actionButtons: ReactNode[] = [];

	if ( actions.length > 0 ) {
		// Use custom actions.
		actionButtons = actions.map( ( action, index ) => (
			<Notice.ActionButton
				key={ index }
				variant={ action.variant === 'primary' ? 'solid' : 'outline' }
				onClick={ action.onClick }
				loading={ action.isLoading }
				loadingAnnouncement={ action.loadingText || __( 'Loading…', 'jetpack-connection-js' ) }
			>
				{ action.label }
			</Notice.ActionButton>
		) );
	} else if ( restoreConnectionCallback ) {
		// Use default restore connection action for backward compatibility.
		actionButtons = [
			<Notice.ActionButton key="restore" variant="solid" onClick={ restoreConnectionCallback }>
				{ __( 'Restore Connection', 'jetpack-connection-js' ) }
			</Notice.ActionButton>,
		];
	}

	return (
		<>
			{ errorRender }
			<Notice.Root key="error" intent="error">
				{ context && <Notice.Title>{ context }</Notice.Title> }
				<Notice.Description>{ message }</Notice.Description>
				{ actionButtons.length > 0 && <Notice.Actions>{ actionButtons }</Notice.Actions> }
			</Notice.Root>
		</>
	);
};

export default ConnectionErrorNotice;
