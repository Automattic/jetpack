import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { siteScanQuery } from '../../data/query-options';
import { useSetHeaderActions } from '../../header-actions-context';
import BulkFixModal from './bulk-fix-modal';
import EmptyState from './empty-state';
import { useThreatActions } from './use-threat-actions';
import type { FC } from 'react';

/**
 * Active threats panel — lists the un-ignored, un-fixed threats from the
 * most recent scan. Wraps the existing `ThreatsDataViews` component from
 * `@automattic/jetpack-scan` (the js-package) so the table fields,
 * sort/search/pagination, and severity badge stay in sync with the
 * legacy Protect surface. Action handlers are stubbed in Phase 1; the
 * fix / ignore / unignore / view-details modals wire up in Phases 3–4.
 *
 * Empty + error states are handled inside the DataViews shell — passing
 * `data={ [] }` renders the table chrome with DataViews' built-in
 * "no items" body so reviewers always see column headers + filter
 * controls (Phase 1+ wires up search / sort persistence on top).
 *
 * @return The active threats panel.
 */
const ActiveThreats: FC = () => {
	const { data, isLoading, error } = useQuery( siteScanQuery() );
	const { onFixThreats, onIgnoreThreats } = useThreatActions();
	const setHeaderActions = useSetHeaderActions();

	const threats = useMemo( () => data?.threats ?? [], [ data ] );
	const fixableCount = useMemo(
		() => threats.filter( threat => !! threat.fixable ).length,
		[ threats ]
	);

	const [ isBulkFixOpen, setBulkFixOpen ] = useState( false );
	const openBulkFix = useCallback( () => setBulkFixOpen( true ), [] );
	const closeBulkFix = useCallback( () => setBulkFixOpen( false ), [] );

	// Slot the "Auto-fix N threats" CTA into the AdminPage header whenever
	// the Active tab has fixable threats. Cleared on tab switch / unmount
	// so other tabs (History) don't inherit it.
	useEffect( () => {
		if ( fixableCount > 0 ) {
			setHeaderActions(
				<Button variant="primary" onClick={ openBulkFix } __next40pxDefaultSize>
					{ sprintf(
						/* translators: %d is the count of threats Jetpack Scan can auto-fix. */
						_n( 'Auto-fix %d threat', 'Auto-fix %d threats', fixableCount, 'jetpack-scan-page' ),
						fixableCount
					) }
				</Button>
			);
		} else {
			setHeaderActions( null );
		}
		return () => setHeaderActions( null );
	}, [ fixableCount, setHeaderActions, openBulkFix ] );

	if ( isLoading ) {
		return <LoadingPlaceholder width="100%" height={ 400 } />;
	}

	if ( error ) {
		return (
			<p>{ __( 'Unable to load active threats. Please try again later.', 'jetpack-scan-page' ) }</p>
		);
	}

	return (
		<>
			<ThreatsDataViews
				data={ threats }
				onFixThreats={ onFixThreats }
				onIgnoreThreats={ onIgnoreThreats }
				empty={
					<EmptyState
						heading={ __( "You're set up. No active threats.", 'jetpack-scan-page' ) }
						body={ __(
							'Jetpack Scan watches your site for vulnerabilities and suspicious files. New findings will appear here.',
							'jetpack-scan-page'
						) }
					/>
				}
			/>
			{ isBulkFixOpen && <BulkFixModal threats={ threats } onClose={ closeBulkFix } /> }
		</>
	);
};

export default ActiveThreats;
