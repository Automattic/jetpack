import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Button, Flex, FlexItem, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * A notice for upgrading to a plan that supports the Enhanced Publishing feature.
 *
 * @return The UpgradeNotice component.
 */
export function UpgradeNotice() {
	if ( isSimpleSite() ) {
		// We don't have any upgrade options on Simple sites, yet.
		return null;
	}

	const redirectUrl = getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );

	const message = __(
		'Choose your social media image or video to share.',
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
