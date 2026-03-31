import { isSimpleSite } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { useSocialUserPreferences } from '../../hooks/use-social-user-preferences';
import { useAutoSaveAndRedirect } from '../form/use-auto-save-and-redirect';
import { AtLimitNotice } from './at-limit-notice';
import { FREE_PLAN_LIMIT, PAID_PLAN_LIMIT } from './constants';
import { PaidAtLimitNotice } from './paid-at-limit-notice';
import styles from './styles.module.scss';
import { getProgressBarClassName, getUpgradeUrl } from './utils';

type XUsageContentProps = {
	used: number;
	limit: number;
	isAtLimit: boolean;
	isNearLimit: boolean;
	isPaid: boolean;
	resetDate?: string;
};

/**
 * Content of the XUsage panel, separated for clarity.
 *
 * @param {XUsageContentProps} props - The props for the XUsageContent component.
 * @return The content to display in the XUsage panel, including usage stats and notices.
 */
export function XUsageContent( {
	used,
	limit,
	isAtLimit,
	isNearLimit,
	isPaid,
	resetDate,
}: XUsageContentProps ) {
	const autosaveAndRedirect = useAutoSaveAndRedirect();
	const { data: preferences, set: setPreference } = useSocialUserPreferences();
	const isDismissed = preferences.dismissedXUsageNotice;
	const handleDismiss = useCallback(
		() => setPreference( 'dismissedXUsageNotice', true ),
		[ setPreference ]
	);

	const label = isPaid
		? _x(
				'Shares to X this month',
				'The amount of shares used for x.com this month',
				'jetpack-publicize-pkg'
		  )
		: _x( 'Shares to X', 'The amount of shares used for x.com', 'jetpack-publicize-pkg' );

	const counterText = sprintf(
		/* translators: %1$d: number of shares used, %2$d: share limit */
		__( '%1$d of %2$d used', 'jetpack-publicize-pkg' ),
		used,
		limit
	);

	const remaining = limit - used;

	return (
		<section className={ styles[ 'x-usage-content' ] } aria-label={ label }>
			<h3 className={ styles[ 'x-usage-label' ] }>{ label }</h3>

			{ /* Show counter + progress bar when not at limit, or when at limit and dismissed */ }
			{ ( ! isAtLimit || isDismissed ) && (
				<>
					<p className={ styles[ 'x-usage-counter' ] }>{ counterText }</p>
					<progress
						className={
							styles[ 'x-usage-progress' ] + ' ' + getProgressBarClassName( isAtLimit, isNearLimit )
						}
						value={ used }
						max={ limit }
					>
						{ counterText }
					</progress>
				</>
			) }

			{ /* At-limit notice for free plan */ }
			{ isAtLimit && ! isPaid && ! isDismissed && (
				<AtLimitNotice onDismiss={ handleDismiss } onUpgrade={ autosaveAndRedirect } />
			) }

			{ /* At-limit notice for paid plan */ }
			{ isAtLimit && isPaid && ! isDismissed && <PaidAtLimitNotice onDismiss={ handleDismiss } /> }

			{ /* Near-limit warning for free plan (not at limit) */ }
			{ isNearLimit && ! isAtLimit && ! isPaid && (
				<p className={ styles[ 'x-usage-warning-text' ] }>
					{ sprintf(
						/* translators: %d: number of shares remaining */
						_n( '%d share to X left.', '%d shares to X left.', remaining, 'jetpack-publicize-pkg' ),
						remaining
					) }
					&nbsp;
					{ ! isSimpleSite() && (
						<ExternalLink href={ getUpgradeUrl() }>
							{ sprintf(
								/* translators: %d: paid plan share limit */
								__( 'Unlock %d shares per month with a paid plan', 'jetpack-publicize-pkg' ),
								PAID_PLAN_LIMIT
							) }
						</ExternalLink>
					) }
				</p>
			) }

			{ /* At-limit inline text for free plan (when notice is dismissed) */ }
			{ isAtLimit && ! isPaid && isDismissed && (
				<p className={ styles[ 'x-usage-warning-text' ] }>
					{ sprintf(
						/* translators: %d: free plan share limit */
						__( "You've used your %d free shares to X.", 'jetpack-publicize-pkg' ),
						FREE_PLAN_LIMIT
					) }
					&nbsp;
					{ ! isSimpleSite() && (
						<ExternalLink href={ getUpgradeUrl() }>
							{ sprintf(
								/* translators: %d: paid plan share limit */
								__( 'Unlock %d shares per month with a paid plan', 'jetpack-publicize-pkg' ),
								PAID_PLAN_LIMIT
							) }
						</ExternalLink>
					) }
				</p>
			) }

			{ /* Reset date for paid plan */ }
			{ isPaid && resetDate && (
				<p className={ styles[ 'x-usage-reset-text' ] }>
					{ isAtLimit
						? sprintf(
								/* translators: %s: reset date (e.g., "May 1 (12 days)") */
								__(
									'Resets %s. Your post will publish to all other connected accounts.',
									'jetpack-publicize-pkg'
								),
								resetDate
						  )
						: sprintf(
								/* translators: %s: reset date (e.g., "May 1 (12 days from now)") */
								__( 'Resets %s', 'jetpack-publicize-pkg' ),
								resetDate
						  ) }
				</p>
			) }

			{ /* Bottom text when at limit (free plan, notice shown) */ }
			{ isAtLimit && ! isPaid && ! isDismissed && (
				<p className={ styles[ 'x-usage-reassurance-text' ] }>
					{ __(
						'Your post will still be shared to all other connected accounts.',
						'jetpack-publicize-pkg'
					) }
				</p>
			) }
		</section>
	);
}
