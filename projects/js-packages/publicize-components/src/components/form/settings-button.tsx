/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 */
import { ExternalLink, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store } from '../../social-store';
import { getSocialScriptData } from '../../utils/script-data';
import styles from './styles.module.scss';

type SettingsButtonProps = {
	label?: string;
	variant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Manage connections button/link displayed below connections list.
 *
 * @param {SettingsButtonProps} props - The component props.
 *
 * @return {import('react').ReactNode} The button/link component.
 */
export function SettingsButton( { label, variant = 'secondary' }: SettingsButtonProps ) {
	const { useAdminUiV1 } = getSocialScriptData().feature_flags;

	const { connections } = useSelect( select => {
		return {
			connections: select( store ).getConnections(),
		};
	}, [] );
	const { openConnectionsModal } = useDispatch( store );
	const { connectionsPageUrl } = usePublicizeConfig();

	const text = label || __( 'Manage connections', 'jetpack-publicize-components' );
	const hasConnections = connections.length > 0;

	return useAdminUiV1 ? (
		<Button
			onClick={ openConnectionsModal }
			variant={ hasConnections ? 'link' : variant }
			className={ styles[ 'settings-button' ] }
		>
			{ text }
		</Button>
	) : (
		<ExternalLink className={ styles[ 'settings-button' ] } href={ connectionsPageUrl }>
			{ text }
		</ExternalLink>
	);
}
