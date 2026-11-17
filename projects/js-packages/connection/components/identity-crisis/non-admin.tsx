import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { getSupportUrl, renderCustomContent } from './custom-content';
import styles from './styles.module.scss';
import type { IdentityCrisisNonAdminProps } from './types';
import type { ReactNode } from 'react';

/**
 * Safe Mode for a user who cannot resolve it.
 *
 * @param {IdentityCrisisNonAdminProps} props - Component props.
 * @return {ReactNode} The view.
 */
export default function IdentityCrisisNonAdmin( {
	customContent = {},
}: IdentityCrisisNonAdminProps ): ReactNode {
	return (
		<Stack direction="column" gap="md">
			<Text variant="heading-xl" render={ <h2 /> }>
				{ renderCustomContent(
					customContent.nonAdminTitle,
					__( 'Jetpack is in Safe Mode', 'jetpack-connection-js' ),
					customContent
				) }
			</Text>
			<Text variant="body-lg" render={ <p /> } className={ styles.prose }>
				{ renderCustomContent(
					customContent.nonAdminBodyText,
					createInterpolateElement(
						__(
							'This site’s address no longer matches the one WordPress.com has on record, so features that sync with WordPress.com are paused. A site administrator can fix this. <safeModeLink>Learn about Safe Mode</safeModeLink>',
							'jetpack-connection-js'
						),
						{ safeModeLink: <Link href={ getSupportUrl( customContent ) } openInNewTab /> }
					),
					customContent
				) }
			</Text>
		</Stack>
	);
}
