import GooglePhotosDisconnect from './google-photos-disconnect';

const GooglePhotosAccount = ( {
	account,
	setAuthenticated,
	disconnectBtnVariant,
	showAccountInfo = true,
} ) => {
	const { image, name } = account || {};

	return (
		<div className="jetpack-external-media-header__account">
			{ showAccountInfo && (
				<div className="jetpack-external-media-header__account-info">
					{ image && (
						<img
							className="jetpack-external-media-header__account-image"
							src={ image }
							alt=""
							height="18"
							width="18"
						/>
					) }
					{ name && <div className="jetpack-external-media-header__account-name">{ name }</div> }
				</div>
			) }

			<GooglePhotosDisconnect
				setAuthenticated={ setAuthenticated }
				buttonVariant={ disconnectBtnVariant }
			/>
		</div>
	);
};

export default GooglePhotosAccount;
