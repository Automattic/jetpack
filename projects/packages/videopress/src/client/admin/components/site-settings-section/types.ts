export type SiteSettingsSectionProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Define if the videos are private at the site level.
	 */
	videoPressVideosPrivateForSite: boolean;

	/**
	 * Callback function to be invoked when the privacy settings changes.
	 */
	onPrivacyChange?: ( isPrivate: boolean ) => void;
};
