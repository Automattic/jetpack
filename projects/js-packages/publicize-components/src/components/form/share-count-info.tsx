import { IconTooltip, Text, ThemeProvider } from '@automattic/jetpack-components';
import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isAtomicSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';
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
	const { showShareLimits, hasPaidFeatures } = useSelect( select => {
		const store = select( socialStore );
		return {
			showShareLimits: store.showShareLimits(),
			hasPaidFeatures: store.hasPaidFeatures(),
		};
	}, [] );

	const { noticeType, usedCount, scheduledCount, remainingCount } = useShareLimits();
	const autosaveAndRedirect = useAutoSaveAndRedirect();

	const isWpcom = isSimpleSite() || isAtomicSite();

	if ( isWpcom || ( ! showShareLimits && hasPaidFeatures ) ) {
		return null;
	}

	return (
		<PanelRow>
			<div className={ styles[ 'share-count-info' ] }>
				<ThemeProvider>
					{ showShareLimits ? (
						<>
							<div className={ styles[ 'title-container' ] }>
								<Text variant="body-extra-small" className={ styles[ 'auto-share-title' ] }>
									{ __( 'Auto-shares this cycle', 'jetpack' ) }
								</Text>
								<IconTooltip inline={ false } shift iconSize={ 16 } placement="top-end">
									<Text variant="body-small">
										{ __(
											'As a free Jetpack Social user, you get 30 shares within every rolling 30-day window.',
											'jetpack'
										) }
									</Text>
								</IconTooltip>
							</div>

							<ShareCountNotice />
							<ShareLimitsBar
								usedCount={ usedCount }
								scheduledCount={ scheduledCount }
								remainingCount={ remainingCount }
								className={ styles[ 'bar-wrapper' ] }
								noticeType={ noticeType }
							/>
						</>
					) : null }
					{ noticeType === 'default' && ! hasPaidFeatures ? (
						<Button
							key="upgrade"
							variant="link"
							onClick={ autosaveAndRedirect }
							href={ getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
								site: getSiteFragment(),
								query: 'redirect_to=' + encodeURIComponent( window.location.href ),
							} ) }
						>
							{ _x(
								'Unlock enhanced media sharing features.',
								'Call to action to buy a new plan',
								'jetpack'
							) }
						</Button>
					) : null }
				</ThemeProvider>
			</div>
		</PanelRow>
	);
};
