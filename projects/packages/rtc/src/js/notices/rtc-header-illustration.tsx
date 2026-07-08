/**
 * RTC Header Illustration
 *
 * Blue decorative header for the RTC notice modals, featuring
 * the "Real-time Collaboration" text with avatars and cursors.
 */

import heroImage from './rtc-hero.png';

const RtcHeaderIllustration = () => {
	return (
		<img
			className="rtc-notice-modal__header-illustration"
			src={ heroImage }
			alt=""
			aria-hidden="true"
		/>
	);
};

export default RtcHeaderIllustration;
