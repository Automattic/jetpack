import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
// Deep imports rather than the `../../utils` barrel, which pulls the social store in.
import { features } from '../../utils/constants';
import { getSimpleSiteUpgradeUrl, getUpgradePlanName } from '../../utils/script-data';

/**
 * A notice for upgrading to a plan that supports the Enhanced Publishing feature.
 *
 * @return The UpgradeNotice component.
 */
export function UpgradeNotice() {
	// Simple sites can't buy the standalone Jetpack Social plan the redirect service
	// points at, so they go to the WordPress.com plans page.
	const redirectUrl =
		getSimpleSiteUpgradeUrl( features.ENHANCED_PUBLISHING, window.location.href ) ??
		getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
			site: getSiteFragment() || '',
			query: 'redirect_to=' + encodeURIComponent( window.location.href ),
		} );

	const planName = getUpgradePlanName();
	const genericMessage = __(
		'Choose your social media image or video to share.',
		'jetpack-publicize-pkg'
	);
	const message = planName
		? sprintf(
				/* translators: %s: name of the plan that unlocks the feature, e.g. "Business". */
				__(
					'Upgrade to the %s plan to choose your social media image or video to share.',
					'jetpack-publicize-pkg'
				),
				planName
		  )
		: genericMessage;

	return (
		/**
		 * Render actions manually instead of using Notice actions prop
		 * because actions are not flexible enough for our use case. e.g., the actions do not accept all the button props.
		 *
		 * @see https://github.com/WordPress/gutenberg/issues/74090
		 */
		<Notice isDismissible={ false } status="info" spokenMessage={ message }>
			<Flex direction="column">
				<FlexItem>{ message }</FlexItem>
				<Flex justify="start" gap={ 3 }>
					<Button
						variant="primary"
						className="is-compact"
						href={ redirectUrl }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Upgrade now', 'jetpack-publicize-pkg' ) }
					</Button>
					<Button
						variant="secondary"
						href={ getRedirectUrl( 'jetpack-social-demo' ) }
						target="_blank"
						className="is-compact"
						rel="noopener noreferrer"
					>
						{ __( 'View demo', 'jetpack-publicize-pkg' ) }
					</Button>
				</Flex>
			</Flex>
		</Notice>
	);
}
