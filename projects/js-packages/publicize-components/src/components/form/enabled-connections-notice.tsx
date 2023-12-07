import { PanelRow } from '@wordpress/components';
import { _n, sprintf } from '@wordpress/i18n';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

/**
 * Displays enabled connections text.
 *
 * @returns {import('react').ReactElement} Enabled connections text.
 */
export function EnabledConnectionsNotice() {
	const { enabledConnections } = useSocialMediaConnections();

	return enabledConnections.length ? (
		<PanelRow>
			<p className={ styles[ 'enabled-connections-notice' ] }>
				{ sprintf(
					/* translators: %d: number of networks */
					_n(
						'This post will be shared to %d network.',
						'This post will be shared to %d networks.',
						enabledConnections.length,
						'jetpack'
					),
					enabledConnections.length
				) }
			</p>
		</PanelRow>
	) : null;
}
