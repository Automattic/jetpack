import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Button, Notice, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import { FIREWALL_PATH, runFirewallTest } from './firewall-test';
import RecentBlocks from './recent-blocks';
import type { TestOutcome } from './firewall-test';
import type { BlockedRequest, FirewallContext, FirewallState } from './types';
import type { ComponentProps } from 'react';
import './style.scss';

const UNAVAILABLE: FirewallState = {
	available: false,
	active: false,
	blockedCount: null,
	recentBlocks: [],
	hasScan: false,
};

type NoticeIntent = ComponentProps< typeof Notice.Root >[ 'intent' ];

const OUTCOMES: Record< TestOutcome | 'error', { intent: NoticeIntent; message: () => string } > = {
	blocked: {
		intent: 'success',
		message: () =>
			__( 'The firewall blocked the test request. It’s working.', 'jetpack-protect-pkg' ),
	},
	silent: {
		intent: 'warning',
		message: () =>
			__(
				'The firewall caught the test request but let it through, because it’s only logging requests.',
				'jetpack-protect-pkg'
			),
	},
	'not-blocked': {
		intent: 'error',
		message: () =>
			__(
				'The test request wasn’t blocked. The firewall may not be running on this site.',
				'jetpack-protect-pkg'
			),
	},
	error: {
		intent: 'error',
		message: () => __( 'The firewall test couldn’t run. Try again.', 'jetpack-protect-pkg' ),
	},
};

const formatCount = ( count: number ) =>
	new Intl.NumberFormat( document.documentElement.lang || undefined ).format( count );

/**
 * The firewall's Overview card: its on/off state, blocked requests and a test that it's working.
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
	const [ blocks, setBlocks ] = useState( {
		blockedCount: firewall.blockedCount,
		recentBlocks: firewall.recentBlocks ?? [],
	} );
	const [ isTesting, setIsTesting ] = useState( false );
	const [ outcome, setOutcome ] = useState< TestOutcome | 'error' | null >( null );

	const runTest = useCallback( async () => {
		setIsTesting( true );
		setOutcome( null );
		try {
			setOutcome( await runFirewallTest() );
			setBlocks(
				await apiFetch< { blockedCount: number | null; recentBlocks: BlockedRequest[] } >( {
					path: `${ FIREWALL_PATH }/blocks`,
				} )
			);
		} catch {
			setOutcome( current => current ?? 'error' );
		} finally {
			setIsTesting( false );
		}
	}, [] );

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
			actions={
				active && (
					<Button variant="outline" size="compact" onClick={ runTest } loading={ isTesting }>
						{ __( 'Test firewall', 'jetpack-protect-pkg' ) }
					</Button>
				)
			}
		>
			<CardRow>
				{ active ? (
					<Stat
						label={ __( 'All-time blocked requests', 'jetpack-protect-pkg' ) }
						value={ blocks.blockedCount === null ? '—' : formatCount( blocks.blockedCount ) }
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
			{ outcome && (
				<CardRow>
					<Notice.Root intent={ OUTCOMES[ outcome ].intent }>
						<Notice.Description>{ OUTCOMES[ outcome ].message() }</Notice.Description>
					</Notice.Root>
				</CardRow>
			) }
			{ active && (
				<CardRow>
					<RecentBlocks blocks={ blocks.recentBlocks } />
				</CardRow>
			) }
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
