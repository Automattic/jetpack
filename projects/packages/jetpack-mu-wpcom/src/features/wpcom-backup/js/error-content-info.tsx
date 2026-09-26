import { __ } from '@wordpress/i18n';
import { Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import {
	findFirstBlockingError,
	findHoldingErrors,
	isAtomicSiteWithoutBusinessPlan,
} from './eligibility.ts';
import { ViewTracker } from './tracks.ts';
import type { TransferError } from './types.ts';
import type { ReactNode } from 'react';

/**
 * "Learn more", appended to a message that has somewhere to point.
 *
 * @param props            - Component props.
 * @param props.supportUrl - Documentation for the error.
 * @return The rendered link.
 */
function LearnMore( { supportUrl }: { supportUrl: string } ): ReactNode {
	return (
		<>
			{ ' ' }
			<Link href={ supportUrl } openInNewTab>
				{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
			</Link>
		</>
	);
}

/**
 * Why the transfer cannot start: one notice for blocking errors, and a list of
 * steps for the ones the reader can clear themselves.
 *
 * Ported from the dashboard's `ErrorContentInfo`
 * (`client/dashboard/sites/hosting-feature-activation-modal/error-content-info.tsx`).
 *
 * @param props        - Component props.
 * @param props.errors - Eligibility errors.
 * @return The rendered errors.
 */
export function ErrorContentInfo( { errors }: { errors: TransferError[] } ) {
	const blocking = ! isAtomicSiteWithoutBusinessPlan( errors ) && findFirstBlockingError( errors );
	const holds = findHoldingErrors( errors );

	return (
		<Stack direction="column" gap="sm">
			{ blocking && (
				<>
					<ViewTracker
						eventName="calypso_dashboard_hosting_feature_activation_modal_blocking_error_impression"
						properties={ { code: blocking.code } }
					/>
					<Notice.Root intent={ blocking.intent }>
						<Notice.Description>
							{ blocking.message }
							{ blocking.supportUrl && <LearnMore supportUrl={ blocking.supportUrl } /> }
						</Notice.Description>
					</Notice.Root>
				</>
			) }
			{ holds.length > 0 && (
				<Card.Root>
					<Card.Header>
						<Text variant="heading-sm" render={ <h2 /> }>
							{ __( 'To activate backups you’ll need to:', 'jetpack-mu-wpcom' ) }
						</Text>
					</Card.Header>
					<Card.Content>
						<Stack direction="column" gap="lg">
							{ holds.map( hold => (
								<Stack key={ hold.code } className="wpcom-backup__hold" direction="column" gap="sm">
									<ViewTracker
										eventName="calypso_dashboard_hosting_feature_activation_modal_holding_error_impression"
										properties={ { code: hold.code } }
									/>
									<Text variant="heading-sm" render={ <h3 /> }>
										{ hold.title }
									</Text>
									<Text render={ <p /> }>
										{ hold.description }
										{ hold.supportUrl && <LearnMore supportUrl={ hold.supportUrl } /> }
									</Text>
								</Stack>
							) ) }
						</Stack>
					</Card.Content>
				</Card.Root>
			) }
		</Stack>
	);
}
