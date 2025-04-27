// to-do: Remove when Jetpack requires WordPress 6.7.
// See https://github.com/Automattic/jetpack/issues/41609.
export const isSupportNext40pxDefaultSize = () => {
	if (
		window?.JetpackExternalMediaData &&
		Object.prototype.hasOwnProperty.call( window?.JetpackExternalMediaData, 'next40pxDefaultSize' )
	) {
		return window?.JetpackExternalMediaData?.next40pxDefaultSize;
	}

	return true;
};
