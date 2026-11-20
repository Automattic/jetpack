/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';

/**
 * Tells the user a connection transfer leaves any Jetpack plan with its purchaser.
 *
 * Links to the support doc rather than a plan page: the package cannot see purchases, and the
 * doc says which plans can be transferred.
 *
 * @return {import('react').ReactNode} The PlanOwnershipNote component.
 */
const PlanOwnershipNote = () => (
	<Text>
		{ createInterpolateElement(
			__(
				'If you need to transfer a plan as well, <link>learn more about how Jetpack plans can be transferred here.</link>',
				'jetpack-connection-js'
			),
			{
				link: (
					<Link
						openInNewTab
						href={ getRedirectUrl( 'jetpack-transfer-connection', {
							anchor:
								'transfer-a-plan-yourself-only-available-for-jetpack-bundles-and-legacy-plans',
						} ) }
					/>
				),
			}
		) }
	</Text>
);

export default PlanOwnershipNote;
