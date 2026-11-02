import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Notice } from '@wordpress/ui';
import { CardRow } from '../../components/card';
import { recordEvent, recordViewOnce } from '../../data/tracks';

const UPSELL_EVENT = 'jetpack_protect_dashboard_firewall_upsell';
const UPSELL_PROPS = { state: 'nothing_to_block' };

/**
 * A warning that a free site's firewall has no IPs and no automatic rules, so it can't block anything.
 *
 * @param props            - Component props.
 * @param props.upgradeUrl - Where to buy Scan.
 * @param props.onAddIps   - Opens the block list's dialog.
 * @param props.isListOff  - Whether the list has addresses but is turned off.
 * @return The row.
 */
export default function NothingToBlockNotice( {
	upgradeUrl,
	onAddIps,
	isListOff,
}: {
	upgradeUrl: string;
	onAddIps: () => void;
	isListOff: boolean;
} ) {
	useEffect( () => recordViewOnce( `${ UPSELL_EVENT }_view`, UPSELL_PROPS ) );

	return (
		<CardRow>
			<Notice.Root intent="warning">
				<Notice.Title>
					{ isListOff
						? __( 'Your block list is turned off', 'jetpack-protect-pkg' )
						: __( 'No IPs added to block list', 'jetpack-protect-pkg' ) }
				</Notice.Title>
				<Notice.Description>
					{ isListOff
						? __(
								'Your firewall has nothing to block right now. Turn the block list back on, or upgrade to get automatic rules that stop new attacks.',
								'jetpack-protect-pkg'
							)
						: __(
								'Your firewall has nothing to block right now. Add IPs to block, or upgrade to get automatic rules that stop new attacks.',
								'jetpack-protect-pkg'
							) }
				</Notice.Description>
				<Notice.Actions>
					<ButtonLink
						href={ upgradeUrl }
						// eslint-disable-next-line react/jsx-no-bind -- ButtonLink isn't memoized, so a stable handler buys nothing.
						onClick={ () => recordEvent( `${ UPSELL_EVENT }_click`, UPSELL_PROPS ) }
					>
						{ __( 'Upgrade', 'jetpack-protect-pkg' ) }
					</ButtonLink>
					<Button variant="outline" onClick={ onAddIps }>
						{ isListOff
							? __( 'Turn on and edit list', 'jetpack-protect-pkg' )
							: __( 'Add IPs to block', 'jetpack-protect-pkg' ) }
					</Button>
				</Notice.Actions>
			</Notice.Root>
		</CardRow>
	);
}
