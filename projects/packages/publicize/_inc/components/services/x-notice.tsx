import '@automattic/ui/style.css';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { hasSocialPaidFeatures } from '../../utils';
import { X_FREE_SHARES, X_PAID_SHARES_PER_MONTH } from './constants';
import styles from './x-notice.module.scss';

/**
 * Notice component for X service, showing different messages based on whether the user has paid features or not.
 *
 * @return The XNotice component.
 */
export function XNotice() {
	const redirectUrl = getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );

	return (
		<Notice.Root intent="info" className={ styles[ 'x-notice-root' ] }>
			<Notice.Title>
				{ hasSocialPaidFeatures()
					? sprintf(
							/* translators: %d: Number of shares included in the paid plan. */
							__( 'Your plan includes %d shares to X per month', 'jetpack-publicize-pkg' ),
							X_PAID_SHARES_PER_MONTH
					  )
					: sprintf(
							/* translators: %d: Number of shares included in the free plan. */
							__( 'Your free plan includes %d shares to X.', 'jetpack-publicize-pkg' ),
							X_FREE_SHARES
					  ) }
			</Notice.Title>
			<Notice.Description>
				{ hasSocialPaidFeatures()
					? __( 'Sharing quota resets on the 1st of each month', 'jetpack-publicize-pkg' )
					: sprintf(
							/* translators: %d: Number of shares included in the free plan. */
							__( 'Need more? Paid plan includes %d shares per month.', 'jetpack-publicize-pkg' ),
							X_PAID_SHARES_PER_MONTH
					  ) }
			</Notice.Description>
			{ ! hasSocialPaidFeatures() && (
				<Notice.Actions>
					<Notice.ActionLink openInNewTab href={ redirectUrl }>
						{ __( 'Compare plans', 'jetpack-publicize-pkg' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
