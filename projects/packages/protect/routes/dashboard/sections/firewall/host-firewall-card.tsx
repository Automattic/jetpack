import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import shieldFlame from './icon';

/**
 * The Firewall card where the host runs its own firewall in place of Jetpack's.
 *
 * @return The card.
 */
export default function HostFirewallCard() {
	return (
		<ProtectCard
			icon={ shieldFlame }
			title={ __( 'Firewall', 'jetpack-protect-pkg' ) }
			status={ { label: __( 'Active', 'jetpack-protect-pkg' ), intent: 'stable' } }
		>
			<CardRow>
				<Text variant="body-md">
					{ __(
						'Your host provides a firewall for your site, so you’re all set.',
						'jetpack-protect-pkg'
					) }
				</Text>
			</CardRow>
		</ProtectCard>
	);
}
