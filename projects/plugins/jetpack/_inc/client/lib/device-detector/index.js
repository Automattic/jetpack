/*
	To detect more devices, add more checks before `return 'desktop';`

	This function will incorrectly identify iPad Pros as 'desktop'. This is
	a known issue due to the iPad Pro userAgent being identical to a Mac.
	Even major libraries such as https://www.npmjs.com/package/device-detector-js detect them as a 'desktop'.
	Because of this, we decided to accept it as this isn't being used for anything critical yet.
 */
/**
 * Determines type of device. Only checks for several major operating systems.
 *
 * @returns {string} 'windows' | 'android' | 'ios' | 'desktop'
 */
function detectDevice() {
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	// Windows Phone must come first because its UA also contains "Android"
	if ( /windows phone/i.test( userAgent ) ) {
		return 'windows';
	}

	if ( /android/i.test( userAgent ) ) {
		return 'android';
	}

	// iOS detection from: http://stackoverflow.com/a/9039885/177710
	if ( /iPad|iPhone|iPod/.test( userAgent ) && ! window.MSStream ) {
		return 'ios';
	}

	// If not one of the major mobile operating systems, return desktop as the above options cover the vast majority of major devices
	return 'desktop';
}

export default detectDevice;
