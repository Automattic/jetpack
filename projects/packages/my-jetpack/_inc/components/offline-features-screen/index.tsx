import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { getMyJetpackWindowRestState } from '../../data/utils/get-my-jetpack-window-state';
import { useReplayPendingNotice } from '../../utils/pending-notice';
import styles from '../my-jetpack-screen/styles.module.scss';
import { FeaturesContent } from '../my-jetpack-tab-panel/features/content';

/**
 * Render the offline Features screen.
 *
 * @return The screen.
 */
export default function OfflineFeaturesScreen() {
	const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
	useReplayPendingNotice();

	return (
		<AdminPage
			title="Jetpack"
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			className={ styles[ 'my-jetpack-screen' ] }
			showBottomBorder={ false }
		>
			<h1 className="screen-reader-text">{ __( 'Features', 'jetpack-my-jetpack' ) }</h1>
			<Notice.Root intent="info">
				<Notice.Title>
					{ __( "You're working in Offline Mode", 'jetpack-my-jetpack' ) }
				</Notice.Title>
				<Notice.Description>
					{ __(
						'Features that need a connection to WordPress.com are paused. You can manage local features here.',
						'jetpack-my-jetpack'
					) }
				</Notice.Description>
			</Notice.Root>
			<FeaturesContent />
		</AdminPage>
	);
}
