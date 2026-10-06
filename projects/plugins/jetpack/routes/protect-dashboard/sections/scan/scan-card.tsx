import { ThreatsDataViews } from '@automattic/jetpack-scan';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { bug, chevronDown, chevronUp } from '@wordpress/icons';
import { Button, Icon, Link, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import SafeState from './safe-state';
import ScanButton from './scan-button';
import type { ScanState } from './types';
import './style.scss';

// Like the Protect plugin: quick checks first, then back off.
const pollInterval = ( polls: number ) => ( polls < 5 ? 5000 : 15000 );

/**
 * The Scan card: start a scan, then review what it found or see that the site is safe.
 *
 * @param props      - Component props.
 * @param props.scan - The report the page loaded with.
 * @return The card.
 */
export default function ScanCard( { scan: initialScan }: { scan: ScanState } ) {
	const [ scan, setScan ] = useState( initialScan );
	const [ isStarting, setIsStarting ] = useState( false );
	const [ startError, setStartError ] = useState< string | null >( null );
	const threats = scan.threats ?? [];
	const [ isOpen, setIsOpen ] = useState( threats.length > 0 );
	const toggle = useCallback( () => setIsOpen( open => ! open ), [] );

	const startScan = useCallback( () => {
		setIsStarting( true );
		setStartError( null );
		apiFetch< ScanState >( { path: '/jetpack/v4/protect-dashboard/scan', method: 'POST' } )
			.then( next => setScan( current => ( { ...current, ...next } ) ) )
			.catch( ( e: { message?: string } ) =>
				setStartError( e?.message || __( 'The scan couldn’t be started.', 'jetpack' ) )
			)
			.finally( () => setIsStarting( false ) );
	}, [] );

	const polls = useRef( 0 );

	// Poll while a scan runs, then show what it found.
	useEffect( () => {
		if ( ! scan.scanning ) {
			polls.current = 0;
			return;
		}
		const timer = setTimeout( () => {
			polls.current++;
			apiFetch< ScanState >( { path: '/jetpack/v4/protect-dashboard/scan' } )
				.then( next => setScan( current => ( { ...current, ...next } ) ) )
				.catch( () => setScan( current => ( { ...current, scanning: false } ) ) );
		}, pollInterval( polls.current ) );
		return () => clearTimeout( timer );
	}, [ scan ] );

	let body;
	if ( scan.scanning ) {
		body = (
			<CardRow>
				<Stack className="jp-protect-safe" direction="column" align="center" gap="md">
					<Spinner />
					<Text variant="body-lg">{ __( 'Scanning your site…', 'jetpack' ) }</Text>
				</Stack>
			</CardRow>
		);
	} else if ( scan.error ) {
		body = (
			<CardRow>
				<Stack direction="column" gap="sm" align="start">
					<Text variant="body-md">
						{ __( 'We couldn’t check your site for vulnerabilities right now.', 'jetpack' ) }
					</Text>
					<Button variant="outline" onClick={ startScan } loading={ isStarting }>
						{ __( 'Try again', 'jetpack' ) }
					</Button>
				</Stack>
			</CardRow>
		);
	} else if ( threats.length === 0 ) {
		body = (
			<CardRow>
				<SafeState scan={ scan } isStarting={ isStarting } onScan={ startScan } />
			</CardRow>
		);
	} else {
		body = (
			<>
				<div className="jp-protect-card__stats">
					<Stat
						label={ __( 'All vulnerabilities found', 'jetpack' ) }
						value={ threats.length }
						warning
					/>
					<Stat label={ __( 'Plugins checked', 'jetpack' ) } value={ scan.pluginsChecked ?? 0 } />
					<Stat label={ __( 'Themes checked', 'jetpack' ) } value={ scan.themesChecked ?? 0 } />
				</div>
				<CardRow className="jp-protect-card__disclosure">
					<button
						type="button"
						className="jp-protect-card__disclosure-toggle"
						aria-expanded={ isOpen }
						onClick={ toggle }
					>
						<Text variant="body-lg">{ __( 'Review and fix threats', 'jetpack' ) }</Text>
						<Icon icon={ isOpen ? chevronUp : chevronDown } size={ 24 } />
					</button>
				</CardRow>
				{ isOpen && (
					<div className="jp-protect-card__threats">
						<ThreatsDataViews
							data={ threats }
							showStatusFilter={ false }
							persistKey="jetpack-protect-dashboard:threats:view"
						/>
					</div>
				) }
			</>
		);
	}

	return (
		<ProtectCard
			icon={ bug }
			title={ __( 'Scan', 'jetpack' ) }
			status={
				scan.hasPlan
					? { label: __( 'Active', 'jetpack' ), intent: 'stable' }
					: { label: __( 'Vulnerability checks only', 'jetpack' ), intent: 'informational' }
			}
			actions={
				threats.length > 0 &&
				! scan.scanning && (
					<ScanButton
						scan={ scan }
						isStarting={ isStarting }
						onScan={ startScan }
						label={ __( 'Scan now', 'jetpack' ) }
						variant="outline"
						size="compact"
					/>
				)
			}
		>
			{ startError && (
				<CardRow>
					<Notice.Root intent="error">
						<Notice.Description>{ startError }</Notice.Description>
					</Notice.Root>
				</CardRow>
			) }
			{ body }
			<CardRow>
				<Link href={ scan.url } openInNewTab={ scan.hasPlan }>
					{ scan.hasPlan
						? __( 'View scan history', 'jetpack' )
						: __( 'Get Scan for daily malware scanning and one-click fixes', 'jetpack' ) }
				</Link>
			</CardRow>
		</ProtectCard>
	);
}
