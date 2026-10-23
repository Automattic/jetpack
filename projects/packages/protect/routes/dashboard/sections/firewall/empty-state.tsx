import { humanTimeDiff } from '@wordpress/date';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, info } from '@wordpress/icons';
import { Badge, Button, ButtonLink, EmptyState, Stack } from '@wordpress/ui';
import { CardRow } from '../../components/card';
import { getIpList, splitIps } from '../../components/settings/ip-list';
import { recordEvent, recordViewOnce } from '../../data/tracks';
import { IpListDialog } from './ip-rule';
import { IP_ALLOW_LIST, IP_BLOCK_LIST } from './settings-keys';
import type { BlockedRequest } from './types';
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
 * @param props.data       - The settings, for the block list dialog.
 * @param props.upgradeUrl - Where to buy Scan.
 * @return The row.
 */
export function NoBlockListState( {
	data,
	upgradeUrl,
}: {
	data: ProtectSettingsData;
	upgradeUrl: string;
} ) {
	useEffect( () => recordViewOnce( `${ UPSELL_EVENT }_view`, UPSELL_PROPS ) );

	return (
		<FirewallEmptyState
			icon={ info }
			title={ __( 'No IPs added to block list', 'jetpack-protect-pkg' ) }
			description={ __(
				'Add IPs manually to run tests or upgrade to get access to a recommended list of suspicious IPs.',
				'jetpack-protect-pkg'
			) }
		>
			<ButtonLink
				href={ upgradeUrl }
				// eslint-disable-next-line react/jsx-no-bind -- ButtonLink isn't memoized, so a stable handler buys nothing.
				onClick={ () => recordEvent( `${ UPSELL_EVENT }_click`, UPSELL_PROPS ) }
			>
				{ __( 'Upgrade', 'jetpack-protect-pkg' ) }
			</ButtonLink>
			<IpListDialog
				data={ data }
				name={ IP_BLOCK_LIST }
				dialogTitle={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
				trigger={ <Button variant="outline" /> }
				enableOnSave
			>
				{ __( 'Add IPs to list', 'jetpack-protect-pkg' ) }
			</IpListDialog>
		</FirewallEmptyState>
	);
}

/**
 * A firewall that hasn't blocked a request yet, other than its own tests.
 *
 * @param props           - Component props.
 * @param props.lastTest  - The latest test's block, if the firewall has been tested.
 * @param props.isTesting - Whether a test is running.
 * @param props.onTest    - Runs the test.
 * @return The row.
 */
export function NoBlocksState( {
	lastTest,
	isTesting,
	onTest,
}: {
	lastTest?: BlockedRequest;
	isTesting: boolean;
	onTest: () => void;
} ) {
	return (
		<FirewallEmptyState
			icon={ check }
			title={ __( 'No requests blocked yet', 'jetpack-protect-pkg' ) }
			description={
				lastTest
					? sprintf(
							/* translators: %s is how long ago, such as "1 hour ago". */
							__( 'No requests were blocked in the latest test ran %s.', 'jetpack-protect-pkg' ),
							humanTimeDiff( lastTest.timestamp )
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
 * The links under an empty state: each IP list with its count, then the firewall's settings.
 *
 * @param props               - Component props.
 * @param props.data          - The settings, with the IP lists.
 * @param props.currentIp     - The visitor's address, offered for the allow list.
 * @param props.showBlockList - Whether to link the block list, which the free empty state already offers.
 * @param props.settingsLink  - The link to the firewall's settings.
 * @return The row.
 */
export function EmptyStateFooter( {
	data,
	currentIp,
	showBlockList,
	settingsLink,
}: {
	data: ProtectSettingsData;
	currentIp: string;
	showBlockList: boolean;
	settingsLink: ReactNode;
} ) {
	const lists = [
		showBlockList && {
			name: IP_BLOCK_LIST,
			label: __( 'Edit block list', 'jetpack-protect-pkg' ),
			dialogTitle: __( 'Blocked IP addresses', 'jetpack-protect-pkg' ),
		},
		{
			name: IP_ALLOW_LIST,
			label: __( 'Edit allow list', 'jetpack-protect-pkg' ),
			dialogTitle: __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ),
			currentIp,
		},
	].filter( Boolean ) as { name: string; label: string; dialogTitle: string; currentIp?: string }[];

	return (
		<CardRow className="jp-protect-firewall-empty__footer">
			<Stack direction="row" gap="lg" align="center" wrap="wrap">
				{ lists.map( list => (
					<Stack key={ list.name } direction="row" gap="sm" align="center">
						<IpListDialog
							data={ data }
							name={ list.name }
							dialogTitle={ list.dialogTitle }
							currentIp={ list.currentIp }
							trigger={ <Button variant="unstyled" className="jp-protect-card__link-button" /> }
							enableOnSave
						>
							{ list.label }
						</IpListDialog>
						<Badge intent="informational">
							{ String( splitIps( getIpList( data.settings, list.name ) ).length ) }
						</Badge>
					</Stack>
				) ) }
				{ settingsLink }
			</Stack>
		</CardRow>
	);
}
