/**
 * External dependencies
 */
import {
	getApiErrorCode,
	useStatsAppReferrersMarkSpamMutation,
	useStatsAppReferrersUnmarkSpamMutation,
} from '@jetpack-premium-analytics/data';
import { useRegistry } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';

const NOTICE_ID = 'jetpack-premium-analytics-referrer-spam';

/**
 * Mark a referrer domain as spam, with a snackbar that can undo it, and keep
 * the domains marked from this surface so their rows can hide until the
 * refetched report drops them.
 *
 * @return `markAsSpam`, and the domains it has hidden.
 */
export function useMarkAsSpam() {
	const [ spammedDomains, setSpammedDomains ] = useState< ReadonlySet< string > >(
		() => new Set()
	);
	const { mutateAsync: markSpam } = useStatsAppReferrersMarkSpamMutation();
	const { mutateAsync: unmarkSpam } = useStatsAppReferrersUnmarkSpamMutation();
	// Read lazily: wp-admin registers `core/notices`, and a widget must still render without it.
	const registry = useRegistry();

	const setSpammed = useCallback( ( domain: string, isSpam: boolean ) => {
		setSpammedDomains( current => {
			const next = new Set( current );

			if ( isSpam ) {
				next.add( domain );
			} else {
				next.delete( domain );
			}

			return next;
		} );
	}, [] );

	const undo = useCallback(
		async ( domain: string ) => {
			try {
				await unmarkSpam( { domain } );
			} catch ( error ) {
				// eslint-disable-next-line no-console -- the notice names no cause, so the code goes where a report can find it
				console.error( 'Unmarking a referrer as spam failed:', getApiErrorCode( error ) ?? error );
				registry.dispatch( 'core/notices' ).createErrorNotice(
					sprintf(
						// translators: %s: The referrer domain, e.g. example.com.
						__( 'Couldn’t undo marking "%s" as spam.', 'jetpack-premium-analytics-pkg' ),
						domain
					),
					{ type: 'snackbar', id: NOTICE_ID }
				);
				return;
			}

			setSpammed( domain, false );
		},
		[ unmarkSpam, registry, setSpammed ]
	);

	const markAsSpam = useCallback(
		async ( domain: string ) => {
			try {
				await markSpam( { domain } );
			} catch ( error ) {
				const code = getApiErrorCode( error );

				// Marked elsewhere since this report loaded, so no Undo: the mark isn't the reader's to remove.
				if ( code === 'already-spammed' ) {
					setSpammed( domain, true );
					registry.dispatch( 'core/notices' ).createSuccessNotice(
						sprintf(
							// translators: %s: The referrer domain, e.g. example.com.
							__( '"%s" was already marked as spam.', 'jetpack-premium-analytics-pkg' ),
							domain
						),
						{ type: 'snackbar', id: NOTICE_ID }
					);
					return;
				}

				// eslint-disable-next-line no-console -- the notice names no cause, so the code goes where a report can find it
				console.error( 'Marking a referrer as spam failed:', code ?? error );
				registry.dispatch( 'core/notices' ).createErrorNotice(
					code === 'reach-limit'
						? __(
								'You’ve reached the limit of spam referrers for this site.',
								'jetpack-premium-analytics-pkg'
							)
						: sprintf(
								// translators: %s: The referrer domain, e.g. example.com.
								__( 'Couldn’t mark "%s" as spam.', 'jetpack-premium-analytics-pkg' ),
								domain
							),
					{ type: 'snackbar', id: NOTICE_ID }
				);
				return;
			}

			setSpammed( domain, true );
			registry.dispatch( 'core/notices' ).createSuccessNotice(
				sprintf(
					// translators: %s: The referrer domain, e.g. example.com.
					__( '"%s" marked as spam.', 'jetpack-premium-analytics-pkg' ),
					domain
				),
				{
					type: 'snackbar',
					id: NOTICE_ID,
					// Snackbars otherwise vanish after 6 seconds, often before the reader reaches Undo.
					explicitDismiss: true,
					actions: [
						{
							label: __( 'Undo', 'jetpack-premium-analytics-pkg' ),
							onClick: () => undo( domain ),
						},
					],
				}
			);
		},
		[ markSpam, registry, setSpammed, undo ]
	);

	return { markAsSpam, spammedDomains };
}
