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
 * @returns {import('react').ReactNode} The button/link component.
 */
export function SettingsButton( { label, variant = 'primary' }: SettingsButtonProps ) {
	const { useAdminUiV1 } = useSelect( select => {
		return {
			useAdminUiV1: select( store ).useAdminUiV1(),
		};
	}, [] );
	const { openConnectionsModal } = useDispatch( store );
	const { connectionsAdminUrl } = usePublicizeConfig();

	const text = label || __( 'Manage connections', 'jetpack' );

	return useAdminUiV1 ? (
		<Button
			onClick={ openConnectionsModal }
			variant={ variant }
			size="small"
			className={ styles[ 'settings-button' ] }
		>
			{ text }
		</Button>
	) : (
		<ExternalLink className={ styles[ 'settings-button' ] } href={ connectionsAdminUrl }>
			{ text }
		</ExternalLink>
	);
}
