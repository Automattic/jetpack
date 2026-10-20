/**
 * Data the server localizes for the banner's script.
 */
export interface BannerSettings {
	trackProps?: Record< string, string >;
	mcpState?: 'on' | 'off' | 'unavailable';
}

/**
 * The part of the banner element showBanner reads and changes.
 */
export interface Banner {
	hidden: boolean;
}

type Track = ( eventName: string, eventProperties: Record< string, string > ) => void;

/**
 * Shows the banner and records an impression. The server hides the banner when the
 * WordPress Agent is already on; it reveals the banner only when MCP is off.
 *
 * @param banner   - The banner element.
 * @param settings - Data localized by the server.
 * @param track    - Records a Tracks event.
 */
export function showBanner( banner: Banner, settings: BannerSettings = {}, track: Track ): void {
	const { trackProps = {}, mcpState } = settings;

	if ( banner.hidden ) {
		if ( mcpState !== 'off' ) {
			return;
		}
		banner.hidden = false;
	}

	track( 'jetpack_ai_assistant_banner_impression', trackProps );
}
