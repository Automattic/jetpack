/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useIsEditor } from '../../hooks/use-is-editor';
import { store } from '../../social-store';
import styles from './styles.module.scss';
import type { ComponentProps } from 'react';

type SettingsButtonProps = {
	label?: string;
	variant?: ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Manage connections button/link displayed below connections list.
 *
 * @param {SettingsButtonProps} props - The component props.
 *
 * @return {import('react').ReactNode} The button/link component.
 */
export function SettingsButton( { label, variant = 'secondary' }: SettingsButtonProps ) {
	const { connections } = useSelect( select => {
		return {
			connections: select( store ).getConnections(),
		};
	}, [] );
	const { openConnectionsModal, openAddAccountModal } = useDispatch( store );

	// In the editor, "Add a new account" opens the lean platform-picker grid; on the admin page it
	// opens the full connections modal.
	const isEditor = useIsEditor();

	const text = label || __( 'Add a new account', 'jetpack-publicize-pkg' );
	const hasConnections = connections.length > 0;

	return (
		<Button
			onClick={ isEditor ? openAddAccountModal : openConnectionsModal }
			variant={ hasConnections ? 'link' : variant }
			className={ styles[ 'settings-button' ] }
		>
			{ text }
		</Button>
	);
}
