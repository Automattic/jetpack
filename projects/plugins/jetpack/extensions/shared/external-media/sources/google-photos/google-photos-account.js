import GooglePhotosDisconnect from './google-photos-disconnect';

const GooglePhotosAccount = ( { account, setAuthenticated } ) => {
	const { image, name } = account || {};

	return (
		<div className="jetpack-external-media-header__account">
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

			<GooglePhotosDisconnect setAuthenticated={ setAuthenticated } />
		</div>
	);
};

export default GooglePhotosAccount;
