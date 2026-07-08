import { type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from 'react';
import { useFixThreatsMutation } from '../../data/use-threat-mutations';

interface ThreatActionHandlers {
	onFixThreats: ( threats: Threat[] ) => Promise< void >;
}

/**
 * Bundles the inline auto-fix mutation into a stable callback compatible
 * with the in-table `ThreatFixerButton`'s `onClick`. Row-action fix /
 * ignore / unignore flows route through dedicated `RenderModal`
 * components on `ThreatsDataViews` (see `fix-threat-modal.tsx` /
 * `ignore-threat-modal.tsx` / `unignore-threat-modal.tsx`); this hook
 * keeps the in-cell "Auto-fix" button working with a fire-and-forget
 * snackbar, since DataViews offers no programmatic way to trigger a row
 * action's modal from a custom field renderer.
 *
 * @return Stable action callback ready to forward to `ThreatsDataViews`.
 */
export function useThreatActions(): ThreatActionHandlers {
	const fixMutation = useFixThreatsMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const onFixThreats = useCallback(
		async ( threats: Threat[] ) => {
			if ( ! threats.length ) {
				return;
			}
			const ids = threats.map( threat => threat.id );
			try {
				await fixMutation.mutateAsync( ids );
				createSuccessNotice(
					sprintf(
						/* translators: %d is the number of threats being auto-fixed. */
						_n(
							'Auto-fix started for %d threat.',
							'Auto-fix started for %d threats.',
							ids.length,
							'jetpack-scan-page'
						),
						ids.length
					),
					{ type: 'snackbar' }
				);
			} catch ( error ) {
				createErrorNotice(
					error instanceof Error
						? error.message
						: __( 'Auto-fix failed. Please try again.', 'jetpack-scan-page' ),
					{ type: 'snackbar' }
				);
			}
		},
		[ fixMutation, createSuccessNotice, createErrorNotice ]
	);

	return { onFixThreats };
}
