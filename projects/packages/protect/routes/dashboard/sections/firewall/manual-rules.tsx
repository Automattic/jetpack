import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import TabLink from '../../components/tab-link';
import type { ProtectSettings } from '../../data/use-protect-settings';
import type { DashboardContext } from '../types';
import type { ManualRulesState } from './types';

const SHOWN = 3;

/**
 * The first few addresses of an IP list setting, and how many more there are.
 *
 * @param list - The setting: addresses or ranges separated by commas, spaces or new lines.
 * @return The addresses to show and the count of the rest.
 */
export function summarizeIpList( list?: unknown ): { shown: string[]; more: number } {
	const ips = typeof list === 'string' ? list.split( /[\s,]+/ ).filter( Boolean ) : [];
	return { shown: ips.slice( 0, SHOWN ), more: Math.max( 0, ips.length - SHOWN ) };
}

/**
 * The manual rules from page load, replaced by the saved settings once the Settings tab loads them.
 *
 * @param fromPageLoad - The rules PHP sent with the page.
 * @param settings     - Jetpack settings, or null before they load.
 * @return The rules to show.
 */
export function getManualRules(
	fromPageLoad: ManualRulesState,
	settings: ProtectSettings | null
): ManualRulesState {
	if ( ! settings ) {
		return fromPageLoad;
	}
	return {
		blockList: String( settings.jetpack_waf_ip_block_list ?? '' ),
		blockListEnabled: Boolean( settings.jetpack_waf_ip_block_list_enabled ),
		allowList: String( settings.jetpack_waf_ip_allow_list ?? '' ),
		allowListEnabled: Boolean( settings.jetpack_waf_ip_allow_list_enabled ),
	};
}

/**
 * One IP list's line: its addresses, "None", or "Off" when the list is turned off.
 *
 * @param props         - Component props.
 * @param props.label   - The list's name.
 * @param props.list    - The setting holding the list.
 * @param props.enabled - Whether the list is on.
 * @return The line.
 */
function IpListSummary( {
	label,
	list,
	enabled,
}: {
	label: string;
	list: unknown;
	enabled: boolean;
} ) {
	const { shown, more } = summarizeIpList( list );
	let value: string = __( 'None', 'jetpack-protect-pkg' );
	if ( ! enabled ) {
		value = __( 'Off', 'jetpack-protect-pkg' );
	} else if ( shown.length ) {
		value = shown.join( ', ' );
		if ( more ) {
			value +=
				' ' +
				sprintf(
					/* translators: %d is how many more IP addresses the list has. */
					_n( '+%d more', '+%d more', more, 'jetpack-protect-pkg' ),
					more
				);
		}
	}

	return (
		<div className="jp-protect-manual-rules__list">
			<Text variant="body-md">{ label }</Text>
			<Text variant="body-md" className="jp-protect-manual-rules__ips">
				{ value }
			</Text>
		</div>
	);
}

/**
 * The firewall's manual rules: the IP addresses it always blocks and always allows.
 *
 * @param props          - Component props.
 * @param props.rules    - The rules as of page load.
 * @param props.settings - Jetpack settings, which hold both lists once loaded.
 * @param props.openTab  - Switches dashboard tabs, for the link to Settings.
 * @return The summary.
 */
export default function ManualRules( {
	rules,
	settings,
	openTab,
}: { rules: ManualRulesState } & Pick< DashboardContext, 'settings' | 'openTab' > ) {
	const current = getManualRules( rules, settings.settings );

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'Manual rules', 'jetpack-protect-pkg' ) }
			</Text>
			<IpListSummary
				label={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
				list={ current.blockList }
				enabled={ current.blockListEnabled }
			/>
			<IpListSummary
				label={ __( 'Always-allowed IP addresses', 'jetpack-protect-pkg' ) }
				list={ current.allowList }
				enabled={ current.allowListEnabled }
			/>
			<TabLink tab="settings" onOpen={ openTab }>
				{ __( 'Manage manual rules', 'jetpack-protect-pkg' ) }
			</TabLink>
		</Stack>
	);
}
