import { ThemeProvider } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { usePostShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import { ShareLimitsBar } from '../share-limits-bar';
import styles from './styles.module.scss';

export const ShareCountInfo: React.FC = () => {
	const showShareLimits = useSelect( select => select( socialStore ).showShareLimits(), [] );
	const { noticeType, usedCount, scheduledCount, remainingCount } = usePostShareLimits();

	if ( ! showShareLimits ) {
		return null;
	}

	return (
		<ThemeProvider>
			<ShareLimitsBar
				usedCount={ usedCount }
				scheduledCount={ scheduledCount }
				remainingCount={ remainingCount }
				className={ styles[ 'bar-wrapper' ] }
				noticeType={ noticeType }
				text={ __( 'Auto-share usage', 'jetpack' ) }
				textVariant="body-extra-small"
			/>
		</ThemeProvider>
	);
};
