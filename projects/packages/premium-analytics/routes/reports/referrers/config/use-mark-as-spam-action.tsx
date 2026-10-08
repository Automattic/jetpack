/**
 * External dependencies
 */
import {
	getApiErrorCode,
	useStatsAppReferrersMarkSpamMutation,
	useStatsAppReferrersUnmarkSpamMutation,
} from '@jetpack-premium-analytics/data';
import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import type { Action } from '@jetpack-premium-analytics/externals';
import type { ReferrerRecord } from '@jetpack-premium-analytics/widgets-toolkit';
import type { JSX } from 'react';

const NOTICE_ID = 'jetpack-premium-analytics-referrer-spam';

type MarkAsSpamConfirmProps = {
	domain: string;
	onConfirm: ( domain: string ) => Promise< void >;
	closeModal?: () => void;
};

/**
 * Confirmation step of the Mark as spam action, shaped like Gutenberg's Trash action.
 *
 * @param {MarkAsSpamConfirmProps} props - The component props.
 * @return {JSX.Element} The confirmation body.
 */
function MarkAsSpamConfirm( {
	domain,
	onConfirm,
	closeModal,
}: MarkAsSpamConfirmProps ): JSX.Element {
	const [ isBusy, setIsBusy ] = useState( false );

	const confirm = useCallback( async () => {
		setIsBusy( true );
		await onConfirm( domain );
		setIsBusy( false );
		closeModal?.();
	}, [ domain, onConfirm, closeModal ] );

	return (
		<Stack direction="column" gap="xl">
			<Text>
				{ sprintf(
					// translators: %s: The referrer domain, e.g. example.com.
					__( 'Are you sure you want to mark "%s" as spam?', 'jetpack-premium-analytics-pkg' ),
					domain
				) }
			</Text>
			<Stack direction="row" justify="flex-end" gap="sm">
				<Button variant="minimal" onClick={ closeModal } disabled={ isBusy }>
					{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
				</Button>
				<Button variant="solid" onClick={ confirm } loading={ isBusy }>
					{ __( 'Mark as spam', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

/**
 * The Referrers report's Mark as spam row action, plus the domains marked on this page.
 *
 * @return The action, and the domains to hide until the refetched report drops them.
 */
export function useMarkAsSpamAction() {
	const [ spammedDomains, setSpammedDomains ] = useState< ReadonlySet< string > >(
		() => new Set()
	);
	const { mutateAsync: markSpam } = useStatsAppReferrersMarkSpamMutation();
	const { mutateAsync: unmarkSpam } = useStatsAppReferrersUnmarkSpamMutation();
	const { createErrorNotice, createSuccessNotice } = useDispatch( 'core/notices' );

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
				createErrorNotice(
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
		[ unmarkSpam, createErrorNotice, setSpammed ]
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
					createSuccessNotice(
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
				createErrorNotice(
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
			createSuccessNotice(
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
		[ markSpam, createErrorNotice, createSuccessNotice, setSpammed, undo ]
	);

	const action = useMemo< Action< ReferrerRecord > >(
		() => ( {
			id: 'mark-as-spam',
			label: __( 'Mark as spam…', 'jetpack-premium-analytics-pkg' ),
			isEligible: item => !! item.spamDomain,
			hideModalHeader: true,
			modalFocusOnMount: 'firstContentElement',
			RenderModal: ( { items, closeModal } ) => (
				<MarkAsSpamConfirm
					domain={ items[ 0 ]?.spamDomain ?? '' }
					onConfirm={ markAsSpam }
					closeModal={ closeModal }
				/>
			),
		} ),
		[ markAsSpam ]
	);

	return { action, spammedDomains };
}
