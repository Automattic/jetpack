import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import SupportLink from './support-link';
import type { ReactNode } from 'react';

/**
 * Safe Mode for a user who cannot resolve it.
 *
 * @return {ReactNode} The view.
 */
export default function IdentityCrisisNonAdmin(): ReactNode {
	return (
		<Stack direction="column" gap="md">
			<Text variant="heading-xl" render={ <h2 /> }>
				{ __( 'Jetpack is in Safe Mode', 'jetpack-connection-js' ) }
			</Text>
			<Text variant="body-lg" render={ <p /> } className={ styles.prose }>
				{ createInterpolateElement(
					__(
						'This site’s address no longer matches the one WordPress.com has on record, so features that sync with WordPress.com are paused. A site administrator can fix this. <safeModeLink>Learn about Safe Mode</safeModeLink>',
						'jetpack-connection-js'
					),
					{ safeModeLink: <SupportLink /> }
				) }
			</Text>
		</Stack>
	);
}
