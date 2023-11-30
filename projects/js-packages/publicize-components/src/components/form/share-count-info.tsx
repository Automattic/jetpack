import { ThemeProvider } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import { ShareLimitsBar } from '../share-limits-bar';
import styles from './styles.module.scss';

export const ShareCountInfo: React.FC = () => {
	const {
		showShareLimits,
		scheduledSharesCount,
		shareCount,
		shareLimit,
		enabledConnections,
		initialConnectionsCount,
	} = useSelect( select => {
		const store = select( socialStore );

		const initialConnections = store.getInitialEnabledConnectionsCount();

		return {
			showShareLimits: store.showShareLimits(),
			scheduledSharesCount: store.getScheduledSharesCount() - initialConnections,
			shareCount: store.getSharesUsedCount(),
			shareLimit: store.getShareLimit(),
			enabledConnections: store.getEnabledConnections(),
			initialConnectionsCount: initialConnections,
		};
	}, [] );

	const { noticeType } = useShareLimits( {
		enabledConnectionsCount: enabledConnections.length,
		initialEnabledConnectionsCount: initialConnectionsCount,
	} );

	if ( ! showShareLimits ) {
		return null;
	}

	return (
		<ThemeProvider>
			<ShareLimitsBar
				limit={ shareLimit }
				usedCount={ shareCount }
				scheduledCount={ scheduledSharesCount }
				className={ styles[ 'bar-wrapper' ] }
				enabledConnectionsCount={ enabledConnections.length }
				noticeType={ noticeType }
				text={ __( 'Auto-share usage', 'jetpack' ) }
			/>
		</ThemeProvider>
	);
};
