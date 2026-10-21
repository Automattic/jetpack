import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';

/**
 * The firewall's card on a host that runs its own firewall, which leaves nothing to set up here.
 *
 * @return The card.
 */
export default function HostProvidedCard() {
	return (
		<ProtectCard
			icon={ shield }
			title={ __( 'Firewall', 'jetpack-protect-pkg' ) }
			status={ { label: __( 'Active', 'jetpack-protect-pkg' ), intent: 'stable' } }
		>
			<CardRow>
				<Text variant="body-md" render={ <p /> }>
					{ __(
						'Your host provides a firewall for your site, so you’re all set.',
						'jetpack-protect-pkg'
					) }
				</Text>
			</CardRow>
		</ProtectCard>
	);
}
