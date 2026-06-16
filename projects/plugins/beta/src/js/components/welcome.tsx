/**
 * Welcome — intro card shown at the top of the plugin overview, explaining what
 * the Beta Tester does.
 *
 * @package
 */

import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';

/**
 * Welcome / intro card.
 *
 * @return The welcome card element.
 */
const Welcome = () => (
	<Card.Root>
		<Card.Content>
			<Stack direction="column" gap="md">
				<Text variant="heading-md" render={ <h2 /> }>
					{ __( 'Welcome to Jetpack Beta Tester', 'jetpack-beta' ) }
				</Text>
				<Text variant="body-md" render={ <p /> }>
					{ __(
						'Thank you for helping to test our plugins! We appreciate your time and effort.',
						'jetpack-beta'
					) }
				</Text>
				<Text variant="body-md" render={ <p /> }>
					{ createInterpolateElement(
						__(
							'When you select a branch to test, Jetpack Beta Tester will install and activate it on your behalf and keep it up to date. When you are finished testing, you can switch back to the current version by selecting <em>Latest Stable</em>.',
							'jetpack-beta'
						),
						{ em: <em /> }
					) }
				</Text>
				<Text variant="body-md" render={ <p /> }>
					{ createInterpolateElement(
						__(
							"Not sure where to start? If you select <em>Bleeding Edge</em>, you'll get all the cool new features we're planning to ship in our next release.",
							'jetpack-beta'
						),
						{ em: <em /> }
					) }
				</Text>
			</Stack>
		</Card.Content>
	</Card.Root>
);

export default Welcome;
