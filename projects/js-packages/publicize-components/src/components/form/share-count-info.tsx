import { Text, ThemeProvider } from '@automattic/jetpack-components';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { useShareLimits } from '../../hooks/use-share-limits';
import { store as socialStore } from '../../social-store';
import { ShareLimitsBar } from '../share-limits-bar';
import { ShareCountNotice } from './share-count-notice';
import styles from './styles.module.scss';
import { useAutoSaveAndRedirect } from './use-auto-save-and-redirect';

export const ShareCountInfo: React.FC = () => {
	const showShareLimits = useSelect( select => select( socialStore ).showShareLimits(), [] );
	const { noticeType, usedCount, scheduledCount, remainingCount } = useShareLimits();
	const autosaveAndRedirect = useAutoSaveAndRedirect();

	if ( ! showShareLimits ) {
		return null;
	}

	return (
		<PanelRow>
			<div className={ styles[ 'share-count-info' ] }>
				<ThemeProvider>
					<Text variant="body-extra-small" className={ styles[ 'auto-share-title' ] }>
						{ __( 'Auto-share usage', 'jetpack' ) }
					</Text>
					<ShareCountNotice />
					<ShareLimitsBar
						usedCount={ usedCount }
						scheduledCount={ scheduledCount }
						remainingCount={ remainingCount }
						className={ styles[ 'bar-wrapper' ] }
						noticeType={ noticeType }
					/>
					{ noticeType === 'default' ? (
						<Button
							key="upgrade"
							variant="link"
							onClick={ autosaveAndRedirect }
							href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
								site: getSiteFragment(),
								query: 'redirect_to=' + encodeURIComponent( window.location.href ),
							} ) }
						>
							{ _x( 'Upgrade to share more.', 'Call to action to buy a new plan', 'jetpack' ) }
						</Button>
					) : null }
				</ThemeProvider>
			</div>
		</PanelRow>
	);
};
