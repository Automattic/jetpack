/**
 * Data the server localizes for the banner's script.
 */
export interface BannerSettings {
	trackProps?: Record< string, string >;
	/** wp_localize_script converts the PHP visibility value to a string. */
	shouldShowBanner?: '1' | '0';
}

/**
 * The part of the banner element showBanner reads and changes.
 */
export interface Banner {
	hidden: boolean;
}

type Track = ( eventName: string, eventProperties: Record< string, string > ) => void;

/**
 * Shows the banner when requested by the server and records an impression.
 *
 * @param banner   - The banner element.
 * @param settings - Data localized by the server.
 * @param track    - Records a Tracks event.
 */
export function showBanner( banner: Banner, settings: BannerSettings = {}, track: Track ): void {
	const { trackProps = {}, shouldShowBanner } = settings;
	const shouldShow = shouldShowBanner === undefined ? ! banner.hidden : shouldShowBanner === '1';

	banner.hidden = ! shouldShow;
	if ( ! shouldShow ) {
		return;
	}

	track( 'jetpack_ai_assistant_banner_impression', trackProps );
}
