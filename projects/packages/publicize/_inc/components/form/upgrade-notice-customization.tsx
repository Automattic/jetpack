import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics, getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
// Deep imports rather than the `../../utils` barrel, which pulls the social store in.
import { features } from '../../utils/constants';
import { getSimpleSiteUpgradeUrl, getUpgradePlanName } from '../../utils/script-data';

/**
 * A notice for upgrading to a plan that supports per-network customization.
 *
 * @return The UpgradeNoticeCustomization component.
 */
export function UpgradeNoticeCustomization() {
	const { recordEvent } = useAnalytics();

	const onClickUpgrade = useCallback( () => {
		recordEvent( 'jetpack_social_per_network_customization_upgrade_click' );
	}, [ recordEvent ] );

	const redirectUrl =
		getSimpleSiteUpgradeUrl( features.ENHANCED_PUBLISHING, window.location.href ) ??
		getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
			site: getSiteFragment() || '',
			query: 'redirect_to=' + encodeURIComponent( window.location.href ),
		} );

	const planName = getUpgradePlanName();
	const genericMessage = __(
		'Customize images and messages for each account for better engagement.',
		'jetpack-publicize-pkg'
	);
	const message = planName
		? sprintf(
				/* translators: %s: name of the plan that unlocks the feature, e.g. "Business". */
				__(
					'Upgrade to the %s plan to customize images and messages for each account.',
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
				<Flex>
					<Button
						variant="primary"
						href={ redirectUrl }
						className="is-compact"
						target="_blank"
						rel="noopener noreferrer"
						onClick={ onClickUpgrade }
					>
						{ __( 'Upgrade now', 'jetpack-publicize-pkg' ) }
					</Button>
				</Flex>
			</Flex>
		</Notice>
	);
}
