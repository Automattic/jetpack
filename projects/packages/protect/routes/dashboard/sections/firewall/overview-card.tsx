import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import { FIREWALL_PATH, SELF_CHECK_RULE_ID, runFirewallTest } from './firewall-test';
import RecentBlocks from './recent-blocks';
import TestDetails from './test-details';
import type { TestOutcome, TestResult } from './firewall-test';
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
	off: {
		intent: 'info',
		message: () =>
			__(
				'The test request got through, because the firewall is off. Turn it on and test again to see it blocked.',
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
 * The firewall's Overview card: its on/off state, blocked requests and a test that shows it working.
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
	const [ result, setResult ] = useState< TestResult | null >( null );
	const [ failed, setFailed ] = useState( false );
	const [ recorded, setRecorded ] = useState( false );
	const active = isModuleActive( settings.settings, 'waf', firewall.active );

	const runTest = useCallback( async () => {
		setIsTesting( true );
		setResult( null );
		setFailed( false );
		try {
			const lastId = blocks.recentBlocks[ 0 ]?.id ?? 0;
			setResult( await runFirewallTest( active ) );
			const fresh = await apiFetch< {
				blockedCount: number | null;
				recentBlocks: BlockedRequest[];
			} >( { path: `${ FIREWALL_PATH }/blocks` } );
			setBlocks( fresh );
			setRecorded(
				fresh.recentBlocks.some( block => block.id > lastId && block.ruleId === SELF_CHECK_RULE_ID )
			);
		} catch {
			setFailed( true );
		} finally {
			setIsTesting( false );
		}
	}, [ active, blocks.recentBlocks ] );

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

	const outcome = result?.outcome ?? ( failed ? 'error' : null );

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
				<Button variant="outline" size="compact" onClick={ runTest } loading={ isTesting }>
					{ __( 'Test firewall', 'jetpack-protect-pkg' ) }
				</Button>
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
					<Stack direction="column" gap="md">
						<Notice.Root intent={ OUTCOMES[ outcome ].intent }>
							<Notice.Description>{ OUTCOMES[ outcome ].message() }</Notice.Description>
						</Notice.Root>
						{ result && <TestDetails result={ result } recorded={ recorded } /> }
					</Stack>
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
