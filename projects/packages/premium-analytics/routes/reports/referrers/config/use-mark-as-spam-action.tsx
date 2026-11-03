/**
 * External dependencies
 */
import { Button, Stack, Text } from '@jetpack-premium-analytics/externals';
import { useMarkAsSpam } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import type { Action } from '@jetpack-premium-analytics/externals';
import type { ReferrerRecord } from '@jetpack-premium-analytics/widgets-toolkit';
import type { JSX } from 'react';

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
	const { markAsSpam, spammedDomains } = useMarkAsSpam();

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
