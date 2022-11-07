export type SiteSettingsSectionProps = {
	/**
	 * Optional classname to apply to the root element.
	 */
	className?: string;

	/**
	 * Callback function to be invoked when the privacy settings changes.
	 */
	onPrivacySettingsChange?: ( isPrivate: boolean ) => void;
};
