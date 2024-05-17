import { PanelRow } from '@wordpress/components';
import { _n, sprintf } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';
import { useConnectionState } from './use-connection-state';

/**
 * Displays enabled connections text.
 *
 * @returns {import('react').ReactElement} Enabled connections text.
 */
export function EnabledConnectionsNotice() {
	const { enabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled } = usePublicizeConfig();
	const { canBeTurnedOn, shouldBeDisabled } = useConnectionState();

	const validConnections = enabledConnections.filter(
		connection => canBeTurnedOn( connection ) && ! shouldBeDisabled( connection )
	);

	return validConnections.length && isPublicizeEnabled ? (
		<PanelRow>
			<p className={ styles[ 'enabled-connections-notice' ] }>
				{ sprintf(
					/* translators: %d: number of connections */
					_n(
						'This post will be shared to %d connection.',
						'This post will be shared to %d connections.',
						validConnections.length,
						'jetpack'
					),
					validConnections.length
				) }
			</p>
		</PanelRow>
	) : null;
}
