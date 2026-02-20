import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useAnalytics, getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

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
