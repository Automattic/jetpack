import { GooglePhotosMediaIcon } from '@automattic/jetpack-shared-extension-utils/icons';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Button, Icon, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import GooglePhotosAccount from './google-photos-account';

/**
 * GooglePhotosPickerButton component
 *
 * @param {object} props - The component props
 * @return {import('react').ReactElement} - JSX Element
 */
export default function GooglePhotosPickerButton( props ) {
	const {
		className,
		pickerSession,
		setAuthenticated,
		account,
		isSessionPending,
		isSessionFailed,
		onRetry,
	} = props;
	const isButtonBusy = isSessionPending || ( ! pickerSession && ! isSessionFailed );

	const openPicker = () => {
		if ( isSessionFailed ) {
			onRetry();
			return;
		}
		pickerSession?.pickerUri && window.open( pickerSession.pickerUri );
	};

	return (
		<Stack
			direction="column"
			align="center"
			justify="center"
			gap="md"
			className={ clsx( className, 'jetpack-external-media__google-photos-picker' ) }
		>
			<GooglePhotosMediaIcon width="150" />
			<Text variant="heading-2xl" render={ <h1 /> }>
				{ __( 'Google Photos', 'jetpack-external-media' ) }
			</Text>
			<Text variant="body-lg" render={ <p /> }>
				{ __(
					'Select photos directly from your Google Photos library.',
					'jetpack-external-media'
				) }
			</Text>

			<Button loading={ isButtonBusy } onClick={ openPicker }>
				{ isSessionFailed ? (
					__( 'Try again', 'jetpack-external-media' )
				) : (
					<>
						{ __( 'Open Google Photos Picker', 'jetpack-external-media' ) }
						<Icon icon={ external } size={ 18 } />
					</>
				) }
			</Button>
			<GooglePhotosAccount
				account={ account }
				setAuthenticated={ setAuthenticated }
				disconnectBtnVariant="minimal"
				showAccountInfo={ false }
			/>
		</Stack>
	);
}
