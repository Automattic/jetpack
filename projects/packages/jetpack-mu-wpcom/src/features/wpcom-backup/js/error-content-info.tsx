import { Card, CardBody, CardDivider, CardHeader, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice, Stack, Text } from '@wordpress/ui';
import { Fragment } from 'react';
import {
	findFirstBlockingError,
	findHoldingErrors,
	isAtomicSiteWithoutBusinessPlan,
} from './eligibility.ts';
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
			<ExternalLink href={ supportUrl }>{ __( 'Learn more', 'jetpack-mu-wpcom' ) }</ExternalLink>
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
				<Notice.Root intent={ blocking.intent }>
					<Notice.Description>
						{ blocking.message }
						{ blocking.supportUrl && <LearnMore supportUrl={ blocking.supportUrl } /> }
					</Notice.Description>
				</Notice.Root>
			) }
			{ holds.length > 0 && (
				<Card size="small">
					<CardHeader>
						<Text variant="heading-sm" render={ <h2 /> }>
							{ __( 'To activate backups you’ll need to:', 'jetpack-mu-wpcom' ) }
						</Text>
					</CardHeader>
					{ holds.map( ( hold, index ) => (
						<Fragment key={ hold.code }>
							<CardBody>
								<Stack direction="column" gap="sm">
									<Text variant="heading-sm" render={ <h3 /> }>
										{ hold.title }
									</Text>
									<Text render={ <p /> }>
										{ hold.description }
										{ hold.supportUrl && <LearnMore supportUrl={ hold.supportUrl } /> }
									</Text>
								</Stack>
							</CardBody>
							{ index < holds.length - 1 && <CardDivider /> }
						</Fragment>
					) ) }
				</Card>
			) }
		</Stack>
	);
}
