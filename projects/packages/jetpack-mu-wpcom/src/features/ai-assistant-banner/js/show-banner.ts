import apiFetch from '@wordpress/api-fetch';

/**
 * The endpoint the server passes for checking MCP access: the native WordPress.com
 * endpoint on Simple sites, or Jetpack's proxy of it on Atomic sites.
 */
export interface McpSettingsApi {
	path: string;
	format: 'wpcom' | 'jetpack';
}

/**
 * Data the server localizes for the banner's script.
 */
export interface BannerSettings {
	trackProps?: Record< string, string >;
	mcpSettingsApi?: McpSettingsApi;
}

/**
 * The part of the banner element showBanner reads and changes.
 */
export interface Banner {
	hidden: boolean;
}

type Track = ( eventName: string, eventProperties: Record< string, string > ) => void;
type FetchSettings = ( path: string ) => Promise< unknown >;

/**
 * Whether an MCP settings response leaves nothing to set up: MCP access is on, or the
 * site has no MCP access to turn on.
 *
 * @param data   - Response from the MCP settings endpoint.
 * @param format - Which endpoint answered.
 * @return True when the banner has no MCP setup to promote.
 */
export function isMcpEnabled( data: unknown, format: McpSettingsApi[ 'format' ] ): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped REST response.
	const response = ( data ?? {} ) as any;

	if ( format === 'wpcom' ) {
		return response.has_mcp_plan === false || response.site_level_enabled === true;
	}

	return (
		response.has_mcp_access === false ||
		response.mcp_abilities?.sites?.[ 0 ]?.site_level_enabled === true
	);
}

/**
 * Shows the banner and records an impression. The server hides the banner when the
 * WordPress Agent is already on, so then it shows only while MCP access is still off,
 * and stays hidden if the check fails.
 *
 * @param banner        - The banner element.
 * @param settings      - Data localized by the server.
 * @param track         - Records a Tracks event.
 * @param fetchSettings - Reads the MCP settings endpoint.
 */
export async function showBanner(
	banner: Banner,
	settings: BannerSettings = {},
	track: Track,
	fetchSettings: FetchSettings = path => apiFetch( { path } )
): Promise< void > {
	const { trackProps = {}, mcpSettingsApi } = settings;

	if ( banner.hidden ) {
		if ( ! mcpSettingsApi?.path ) {
			return;
		}

		try {
			const data = await fetchSettings( mcpSettingsApi.path );
			if ( isMcpEnabled( data, mcpSettingsApi.format ) ) {
				return;
			}
		} catch {
			return;
		}

		banner.hidden = false;
	}

	track( 'jetpack_ai_assistant_banner_impression', trackProps );
}
