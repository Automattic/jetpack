import { GooglePhotosLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Fragment, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';

/**
 * AuthInstructions component
 *
 * @return {import('react').ReactElement} - JSX Element
 */
function AuthInstructions() {
	return (
		<Fragment>
			<GooglePhotosLogo />
			<Text variant="body-lg" render={ <p /> }>
				{ __(
					'To get started, connect your site to your Google Photos library.',
					'jetpack-external-media'
				) }
			</Text>
			<Text variant="body-lg" render={ <p /> }>
				{ __(
					'You can remove the connection in either of these places:',
					'jetpack-external-media'
				) }
			</Text>
			<ul>
				<li>
					<Link openInNewTab href="https://myaccount.google.com/security">
						{ __( 'Google Security page', 'jetpack-external-media' ) }
					</Link>
				</li>
			</ul>
		</Fragment>
	);
}

export default memo( AuthInstructions );
