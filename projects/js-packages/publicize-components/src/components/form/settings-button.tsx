/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 */
import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store } from '../../social-store';
import styles from './styles.module.scss';

/**
 * Manage connections button/link displayed below connections list.
 *
 * @returns {import('react').ReactNode} The button/link component.
 */
export function SettingsButton() {
	const { useAdminUiV1 } = useSelect( select => {
		return {
			useAdminUiV1: select( store ).useAdminUiV1(),
		};
	}, [] );
	const { openConnectionsModal } = useDispatch( store );
	const { connectionsAdminUrl } = usePublicizeConfig();

	return useAdminUiV1 ? (
		<Button
			className={ styles[ 'settings-button' ] }
			onClick={ openConnectionsModal }
			variant="link"
		>
			{ __( 'Manage connections', 'jetpack' ) }
		</Button>
	) : (
		<ExternalLink href={ connectionsAdminUrl }>
			{ __( 'Manage connections', 'jetpack' ) }
		</ExternalLink>
	);
}
