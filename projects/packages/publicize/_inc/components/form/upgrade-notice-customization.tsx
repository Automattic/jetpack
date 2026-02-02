import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * A notice for upgrading to a plan that supports per-network customization.
 *
 * @return The UpgradeNoticeCustomization component.
 */
export function UpgradeNoticeCustomization() {
	if ( isSimpleSite() ) {
		return null;
	}

	const redirectUrl = getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );

	const message = __(
		'Customize images and messages for each account for better engagement.',
		'jetpack-publicize-pkg'
	);

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
					<Button variant="primary" href={ redirectUrl } target="_blank" rel="noopener noreferrer">
						{ __( 'Upgrade now', 'jetpack-publicize-pkg' ) }
					</Button>
				</Flex>
			</Flex>
		</Notice>
	);
}
