import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import type { FirewallContext, FirewallState } from './types';

const UNAVAILABLE: FirewallState = {
	available: false,
	active: false,
	blockedCount: null,
	hasScan: false,
};

const formatCount = ( count: number ) =>
	new Intl.NumberFormat( document.documentElement.lang || undefined ).format( count );

/**
 * The firewall's Overview card: its on/off state and how many requests it has blocked.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The firewall's state from page load.
 * @param props.settings - Jetpack settings, for the live on/off state.
 * @param props.openTab  - Switches dashboard tabs, for the link to Settings.
 * @return The card.
 */
export default function FirewallOverviewCard( { state, settings, openTab }: FirewallContext ) {
	const firewall = state ?? UNAVAILABLE;
	const title = __( 'Firewall', 'jetpack-protect-pkg' );

	if ( ! firewall.available ) {
		return (
			<ProtectCard
				icon={ shield }
				title={ title }
				status={ { label: __( 'Unavailable', 'jetpack-protect-pkg' ), intent: 'none' } }
			>
				<CardRow>
					<Text variant="body-md">
						{ __( 'This feature isn’t available on your site.', 'jetpack-protect-pkg' ) }
					</Text>
				</CardRow>
			</ProtectCard>
		);
	}

	const active = isModuleActive( settings.settings, 'waf', firewall.active );

	return (
		<ProtectCard
			icon={ shield }
			title={ title }
			status={
				active
					? { label: __( 'On', 'jetpack-protect-pkg' ), intent: 'stable' }
					: { label: __( 'Off', 'jetpack-protect-pkg' ), intent: 'draft' }
			}
		>
			<CardRow>
				{ active ? (
					<Stat
						label={ __( 'All-time blocked requests', 'jetpack-protect-pkg' ) }
						value={ firewall.blockedCount === null ? '—' : formatCount( firewall.blockedCount ) }
					/>
				) : (
					<Text variant="body-md">
						{ __(
							'Turn on the firewall to block malicious requests before they reach your site.',
							'jetpack-protect-pkg'
						) }
					</Text>
				) }
			</CardRow>
			<CardRow>
				<TabLink tab="settings" onOpen={ openTab }>
					{ active
						? __( 'Configure Firewall', 'jetpack-protect-pkg' )
						: __( 'Turn on in Settings', 'jetpack-protect-pkg' ) }
				</TabLink>
			</CardRow>
		</ProtectCard>
	);
}
