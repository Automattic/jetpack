import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useDismissNotice from '../../hooks/use-dismiss-notice';
import Notice from '../notice';

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

export const AdvancedPlanNudge: React.FC = () => {
	const { shouldShowAdvancedPlanNudge } = usePublicizeConfig();

	const { dismissNotice, shouldShowNotice, NOTICES } = useDismissNotice();
	const onAdvancedNudgeDismiss = useCallback(
		() => dismissNotice( NOTICES.advancedUpgradeEditor, 3 * MONTH_IN_SECONDS ),
		[ dismissNotice, NOTICES ]
	);

	return (
		shouldShowAdvancedPlanNudge &&
		shouldShowNotice( NOTICES.advancedUpgradeEditor ) && (
			<Notice onDismiss={ onAdvancedNudgeDismiss } type={ 'highlight' }>
				{ createInterpolateElement(
					__(
						'Need more reach? Unlock custom media sharing with the <upgradeLink>Advanced Plan</upgradeLink>',
						'jetpack'
					),
					{
						upgradeLink: (
							<ExternalLink
								href={ getRedirectUrl( 'jetpack-social-advanced-site-checkout', {
									site: getSiteFragment(),
									query: 'redirect_to=' + encodeURIComponent( window.location.href ),
								} ) }
							/>
						),
					}
				) }
			</Notice>
		)
	);
};
