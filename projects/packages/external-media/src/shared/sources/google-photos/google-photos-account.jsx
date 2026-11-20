import { Stack, Text } from '@wordpress/ui';
import GooglePhotosDisconnect from './google-photos-disconnect';

const GooglePhotosAccount = ( {
	account,
	setAuthenticated,
	disconnectBtnVariant,
	showAccountInfo = true,
} ) => {
	const { image, name } = account || {};

	return (
		<Stack direction="column" gap="sm" className="jetpack-external-media-header__account">
			{ showAccountInfo && (
				<Stack direction="row" gap="sm" align="center">
					{ image && (
						<img
							className="jetpack-external-media-header__account-image"
							src={ image }
							alt=""
							height="18"
							width="18"
						/>
					) }
					{ name && <Text className="jetpack-external-media-header__account-name">{ name }</Text> }
				</Stack>
			) }

			<GooglePhotosDisconnect
				setAuthenticated={ setAuthenticated }
				buttonVariant={ disconnectBtnVariant }
			/>
		</Stack>
	);
};

export default GooglePhotosAccount;
