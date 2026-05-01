import { type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from 'react';
import {
	useFixThreatsMutation,
	useIgnoreThreatMutation,
	useUnignoreThreatMutation,
} from '../../data/use-threat-mutations';

interface ThreatActionHandlers {
	onFixThreats: ( threats: Threat[] ) => Promise< void >;
	onIgnoreThreats: ( threats: Threat[] ) => Promise< void >;
	onUnignoreThreats: ( threats: Threat[] ) => Promise< void >;
}

/**
 * Bundles the three single-threat mutation hooks (fix, ignore, unignore)
 * into a stable set of callbacks compatible with `ThreatsDataViews`'
 * `onFix`/`onIgnore`/`onUnignore` props, and fires a `core/notices`
 * snackbar on success / failure so the user gets immediate feedback
 * regardless of which row action they triggered.
 *
 * The fix-status polling loop (Phase 4 bulk-fix modal) is not wired up
 * here — the UI today shows "Fix kicked off" success and lets the
 * underlying scan query refresh asynchronously. Phase 4 swaps that for
 * a modal driven by `useFixThreatsStatusQuery`.
 *
 * @return Stable action callbacks ready to forward to `ThreatsDataViews`.
 */
export function useThreatActions(): ThreatActionHandlers {
	const fixMutation = useFixThreatsMutation();
	const ignoreMutation = useIgnoreThreatMutation();
	const unignoreMutation = useUnignoreThreatMutation();
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

	const onIgnoreThreats = useCallback(
		async ( threats: Threat[] ) => {
			const targets = threats ?? [];
			if ( targets.length === 0 ) {
				return;
			}
			try {
				await Promise.all( targets.map( threat => ignoreMutation.mutateAsync( threat.id ) ) );
				createSuccessNotice(
					sprintf(
						/* translators: %d is the number of threats being ignored. */
						_n( '%d threat ignored.', '%d threats ignored.', targets.length, 'jetpack-scan-page' ),
						targets.length
					),
					{ type: 'snackbar' }
				);
			} catch ( error ) {
				createErrorNotice(
					error instanceof Error
						? error.message
						: __( 'Failed to ignore threat. Please try again.', 'jetpack-scan-page' ),
					{ type: 'snackbar' }
				);
			}
		},
		[ ignoreMutation, createSuccessNotice, createErrorNotice ]
	);

	const onUnignoreThreats = useCallback(
		async ( threats: Threat[] ) => {
			const targets = threats ?? [];
			if ( targets.length === 0 ) {
				return;
			}
			try {
				await Promise.all( targets.map( threat => unignoreMutation.mutateAsync( threat.id ) ) );
				createSuccessNotice(
					sprintf(
						/* translators: %d is the number of threats being un-ignored. */
						_n(
							'%d threat unignored.',
							'%d threats unignored.',
							targets.length,
							'jetpack-scan-page'
						),
						targets.length
					),
					{ type: 'snackbar' }
				);
			} catch ( error ) {
				createErrorNotice(
					error instanceof Error
						? error.message
						: __( 'Failed to unignore threat. Please try again.', 'jetpack-scan-page' ),
					{ type: 'snackbar' }
				);
			}
		},
		[ unignoreMutation, createSuccessNotice, createErrorNotice ]
	);

	return { onFixThreats, onIgnoreThreats, onUnignoreThreats };
}
