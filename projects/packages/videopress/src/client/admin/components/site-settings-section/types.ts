import { SiteType } from '../../types';

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
	 * Read-only prop to inform the settings section if the site is private or not.
	 */
	siteIsPrivate?: boolean;

	/**
	 * Read-only prop to inform the settings section which type is the site
	 */
	siteType?: SiteType;

	/**
	 * Callback function to be invoked when the privacy settings changes.
	 */
	onPrivacyChange?: ( isPrivate: boolean ) => void;
};
