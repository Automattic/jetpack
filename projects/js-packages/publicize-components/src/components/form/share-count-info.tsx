import { ThemeProvider } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import { ShareLimitsBar } from '../share-limits-bar';
import styles from './styles.module.scss';

export const ShareCountInfo: React.FC = () => {
	const { showShareLimits, scheduledSharesCount, shareCount, shareLimit, activeConnections } =
		useSelect( select => {
			const store = select( socialStore );

			return {
				showShareLimits: store.showShareLimits(),
				scheduledSharesCount: store.getScheduledSharesCount(),
				shareCount: store.getSharesUsedCount(),
				shareLimit: store.getShareLimit(),
				activeConnections: store.getEnabledConnections(),
			};
		}, [] );

	if ( ! showShareLimits ) {
		return null;
	}

	return (
		<ThemeProvider>
			<ShareLimitsBar
				maxCount={ shareLimit }
				currentCount={ shareCount }
				scheduledCount={ scheduledSharesCount }
				className={ styles[ 'bar-wrapper' ] }
				activeConnectionsCount={ activeConnections.length }
			/>
		</ThemeProvider>
	);
};
