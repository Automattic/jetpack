import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Dialog, Stack, Text } from '@wordpress/ui';
import { SELF_CHECK_RULE_ID, getBlockLabel } from './firewall-test';
import type { BlockedRequest } from './types';

const formatTime = ( block: BlockedRequest ) => (
	<time dateTime={ block.timestamp }>{ dateI18n( 'M j, g:i A', block.timestamp, undefined ) }</time>
);

/**
 * The firewall's recent blocked requests: the latest on the card, all of them in a dialog.
 *
 * @param props        - Component props.
 * @param props.blocks - The blocked requests, newest first.
 * @return The summary and dialog.
 */
export default function RecentBlocks( { blocks }: { blocks: BlockedRequest[] } ) {
	const title = __( 'Recently blocked requests', 'jetpack-protect-pkg' );
	const [ latest ] = blocks;

	return (
		<Stack direction="row" gap="md" justify="space-between" align="center" wrap="wrap">
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm" render={ <h3 /> }>
					{ title }
				</Text>
				<Text variant="body-sm" className="jp-protect-card__muted">
					{ latest ? (
						<>
							{ sprintf(
								/* translators: %s is why a request was blocked, such as "Blocked IP address". */
								__( 'Latest: %s,', 'jetpack-protect-pkg' ),
								getBlockLabel( latest )
							) }{ ' ' }
							{ formatTime( latest ) }
						</>
					) : (
						__( 'No blocked requests yet.', 'jetpack-protect-pkg' )
					) }
				</Text>
			</Stack>
			{ latest && (
				<Dialog.Root>
					<Dialog.Trigger render={ <Button variant="outline" size="compact" /> }>
						{ __( 'View blocked requests', 'jetpack-protect-pkg' ) }
					</Dialog.Trigger>
					<Dialog.Popup size="large">
						<Dialog.Header>
							<Dialog.Title>{ title }</Dialog.Title>
							<Dialog.CloseIcon />
						</Dialog.Header>
						<Dialog.Content>
							<table className="jp-protect-blocks-table">
								<thead>
									<tr>
										<th scope="col">{ __( 'When', 'jetpack-protect-pkg' ) }</th>
										<th scope="col">{ __( 'Reason', 'jetpack-protect-pkg' ) }</th>
									</tr>
								</thead>
								<tbody>
									{ blocks.map( block => (
										<tr key={ block.id }>
											<td className="jp-protect-blocks-table__when">{ formatTime( block ) }</td>
											<td className="jp-protect-blocks-table__reason">
												<Badge
													intent={ block.ruleId === SELF_CHECK_RULE_ID ? 'informational' : 'none' }
												>
													{ getBlockLabel( block ) }
												</Badge>
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			) }
		</Stack>
	);
}
