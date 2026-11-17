import { GooglePhotosLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import GooglePhotosDisconnect from './google-photos-disconnect';

/**
 * GooglePhotosAuthUpgrade component
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
export default function GooglePhotosAuthUpgrade( props ) {
	const { setAuthenticated, onRetry } = props;

	return (
		<Stack
			direction="column"
			align="center"
			justify="center"
			gap="lg"
			className="jetpack-external-media-auth"
		>
			<GooglePhotosLogo />

			<Text variant="body-lg" render={ <p /> }>
				{ __(
					'Reconnect your Google account to keep using Google Photos.',
					'jetpack-external-media'
				) }
			</Text>

			<Stack direction="row" gap="sm" justify="center" wrap="wrap">
				{ onRetry && (
					<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-external-media' ) }</Button>
				) }
				<GooglePhotosDisconnect setAuthenticated={ setAuthenticated } />
			</Stack>
		</Stack>
	);
}
