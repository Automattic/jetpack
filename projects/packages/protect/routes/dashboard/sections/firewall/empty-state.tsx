import { humanTimeDiff } from '@wordpress/date';
import { useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, info } from '@wordpress/icons';
import { Badge, Button, ButtonLink, EmptyState, Stack, VisuallyHidden } from '@wordpress/ui';
import { CardRow } from '../../components/card';
import { getIpList, splitIps } from '../../components/settings/ip-list';
import { recordEvent, recordViewOnce } from '../../data/tracks';
import { IpListDialog } from './ip-list-dialog';
import { IP_ALLOW_LIST, IP_BLOCK_LIST } from './settings-keys';
import type { ProtectSettingsData } from '../../data/use-protect-settings';
import type { ReactElement, ReactNode } from 'react';

const UPSELL_EVENT = 'jetpack_protect_dashboard_firewall_upsell';
const UPSELL_PROPS = { state: 'empty' };

/**
 * The card row holding an empty state, with the buttons that get the firewall going.
 *
 * @param props             - Component props.
 * @param props.icon        - The state's icon.
 * @param props.title       - The heading.
 * @param props.description - The line under it.
 * @param props.children    - The buttons.
 * @return The row.
 */
function FirewallEmptyState( {
	icon,
	title,
	description,
	children,
}: {
	icon: ReactElement;
	title: string;
	description: string;
	children: ReactNode;
} ) {
	return (
		<CardRow className="jp-protect-firewall-empty">
			<EmptyState.Root>
				<EmptyState.Icon icon={ icon } />
				<EmptyState.Title render={ <h3 /> }>{ title }</EmptyState.Title>
				<EmptyState.Description>{ description }</EmptyState.Description>
				<EmptyState.Actions>{ children }</EmptyState.Actions>
			</EmptyState.Root>
		</CardRow>
	);
}

/**
 * A free site's firewall with nothing to block yet: add IPs by hand, or upgrade for the automatic rules.
 *
 * @param props            - Component props.
 * @param props.upgradeUrl - Where to buy Scan.
 * @param props.onAddIps   - Opens the block list's dialog.
 * @param props.isListOff  - Whether the list has addresses but is turned off.
 * @return The row.
 */
export function NoBlockListState( {
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
		<FirewallEmptyState
			icon={ info }
			title={
				isListOff
					? __( 'Your block list is turned off', 'jetpack-protect-pkg' )
					: __( 'No IPs added to block list', 'jetpack-protect-pkg' )
			}
			description={
				isListOff
					? __(
							'Turn it on to block the IPs on it, or upgrade to get automatic rules that stop new attacks.',
							'jetpack-protect-pkg'
						)
					: __(
							'Add IPs to block to run tests, or upgrade to get automatic rules that stop new attacks.',
							'jetpack-protect-pkg'
						)
			}
		>
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
					: __( 'Add IPs to list', 'jetpack-protect-pkg' ) }
			</Button>
		</FirewallEmptyState>
	);
}

/**
 * A firewall that hasn't blocked a request yet, other than its own tests.
 *
 * @param props            - Component props.
 * @param props.lastTestAt - When the firewall was last tested, if it has been.
 * @param props.isTesting  - Whether a test is running.
 * @param props.onTest     - Runs the test.
 * @return The row.
 */
export function NoBlocksState( {
	lastTestAt,
	isTesting,
	onTest,
}: {
	lastTestAt?: string | null;
	isTesting: boolean;
	onTest: () => void;
} ) {
	return (
		<FirewallEmptyState
			icon={ check }
			title={ __( 'No requests blocked yet', 'jetpack-protect-pkg' ) }
			description={
				lastTestAt
					? sprintf(
							/* translators: %s is how long ago, such as "1 hour ago". */
							__(
								'The latest test ran %s. No other requests have been blocked yet.',
								'jetpack-protect-pkg'
							),
							humanTimeDiff( lastTestAt )
						)
					: __(
							'Get started by testing your firewall and start blocking requests from suspicious IPs.',
							'jetpack-protect-pkg'
						)
			}
		>
			<Button onClick={ onTest } loading={ isTesting }>
				{ __( 'Run test', 'jetpack-protect-pkg' ) }
			</Button>
		</FirewallEmptyState>
	);
}

/**
 * How many addresses a list holds, as a badge with its meaning for screen readers.
 *
 * @param props       - Component props.
 * @param props.count - The number of addresses.
 * @return The count.
 */
function ListCount( { count }: { count: number } ) {
	return (
		<>
			<span aria-hidden="true">
				<Badge intent="informational">{ String( count ) }</Badge>
			</span>
			<VisuallyHidden>
				{ sprintf(
					/* translators: %d is how many IP addresses are on a list. */
					_n( '%d address on the list', '%d addresses on the list', count, 'jetpack-protect-pkg' ),
					count
				) }
			</VisuallyHidden>
		</>
	);
}

/**
 * The links at the foot of the card: each IP list with its count, then the firewall's settings.
 *
 * @param props                 - Component props.
 * @param props.data            - The settings, with the IP lists.
 * @param props.currentIp       - The visitor's address, offered for the allow list.
 * @param props.onEditBlockList - Opens the block list's dialog; leave out to drop its link.
 * @param props.settingsLink    - The link to the firewall's settings.
 * @param props.aside           - Optional text at the end, such as when the rules were updated.
 * @return The row.
 */
export function FirewallFooter( {
	data,
	currentIp,
	onEditBlockList,
	settingsLink,
	aside,
}: {
	data: ProtectSettingsData;
	currentIp: string;
	onEditBlockList?: () => void;
	settingsLink: ReactNode;
	aside?: ReactNode;
} ) {
	const countOf = ( name: string ) => splitIps( getIpList( data.settings, name ) ).length;
	const linkClass = 'jp-protect-card__link-button';

	return (
		<CardRow className="jp-protect-firewall-footer">
			<Stack direction="row" gap="lg" align="center" wrap="wrap">
				{ onEditBlockList && (
					<Stack direction="row" gap="sm" align="center">
						<Button variant="unstyled" className={ linkClass } onClick={ onEditBlockList }>
							{ __( 'Edit block list', 'jetpack-protect-pkg' ) }
						</Button>
						<ListCount count={ countOf( IP_BLOCK_LIST ) } />
					</Stack>
				) }
				<Stack direction="row" gap="sm" align="center">
					<IpListDialog
						data={ data }
						name={ IP_ALLOW_LIST }
						dialogTitle={ __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ) }
						currentIp={ currentIp }
						trigger={ <Button variant="unstyled" className={ linkClass } /> }
						enableOnSave
					>
						{ __( 'Edit allow list', 'jetpack-protect-pkg' ) }
					</IpListDialog>
					<ListCount count={ countOf( IP_ALLOW_LIST ) } />
				</Stack>
				{ settingsLink }
				{ aside }
			</Stack>
		</CardRow>
	);
}
