import { dateI18n, humanTimeDiff } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Dialog, Stack, Text } from '@wordpress/ui';
import useRerenderEvery from '../../components/use-rerender-every';
import { SELF_CHECK_RULE_ID, getBlockLabel } from './firewall-test';
import { summarizeUserAgent } from './user-agent';
import type { BlockedRequest } from './types';

const detailClass = ( column: string, value?: string ) =>
	`jp-protect-blocks-table__${ column }${ value ? '' : ' is-empty' }`;

const NOT_LOGGED = <span className="jp-protect-card__muted">—</span>;

const formatTime = ( block: BlockedRequest ) => (
	<time dateTime={ block.timestamp }>{ dateI18n( 'M j, g:i A', block.timestamp, undefined ) }</time>
);

/** How many blocks the card lists; the dialog has all of them. */
const LISTED = 3;

/**
 * The newest blocked requests, and a dialog listing them all with their details.
 *
 * @param props        - Component props.
 * @param props.blocks - The blocked requests, newest first.
 * @return The list and dialog.
 */
export default function RecentBlocks( { blocks }: { blocks: BlockedRequest[] } ) {
	const [ latest ] = blocks;
	useRerenderEvery( 30000, !! latest );

	if ( ! latest ) {
		return null;
	}
	const hasDetails = blocks.some( block => block.uri || block.userAgent );

	return (
		<Stack direction="column" gap="sm" align="start">
			<Text variant="body-sm" className="jp-protect-card__muted">
				{ __( 'Recently blocked', 'jetpack-protect-pkg' ) }
			</Text>
			<table className="jp-protect-recent-blocks">
				<tbody>
					{ blocks.slice( 0, LISTED ).map( block => (
						<tr key={ block.id }>
							<td className="jp-protect-recent-blocks__when">
								<time
									dateTime={ block.timestamp }
									title={ dateI18n( 'M j, Y g:i A', block.timestamp, undefined ) }
								>
									{ humanTimeDiff( block.timestamp ) }
								</time>
							</td>
							<td className="jp-protect-recent-blocks__reason">{ getBlockLabel( block ) }</td>
							<td className="jp-protect-recent-blocks__request">
								{ block.uri && <code title={ block.uri }>{ block.uri }</code> }
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
			<Dialog.Root>
				<Dialog.Trigger
					render={ <Button variant="unstyled" className="jp-protect-card__link-button" /> }
				>
					{ __( 'View blocked requests', 'jetpack-protect-pkg' ) }
				</Dialog.Trigger>
				<Dialog.Popup size="large">
					<Dialog.Header>
						<Dialog.Title>
							{ __( 'Recently blocked requests', 'jetpack-protect-pkg' ) }
						</Dialog.Title>
						<Dialog.CloseIconButton />
					</Dialog.Header>
					<Dialog.Content>
						<table className="jp-protect-blocks-table">
							<thead>
								<tr>
									<th scope="col">{ __( 'When', 'jetpack-protect-pkg' ) }</th>
									<th scope="col">{ __( 'Reason', 'jetpack-protect-pkg' ) }</th>
									{ hasDetails && (
										<>
											<th scope="col">{ __( 'Request', 'jetpack-protect-pkg' ) }</th>
											<th scope="col">{ __( 'Client', 'jetpack-protect-pkg' ) }</th>
										</>
									) }
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
										{ hasDetails && (
											<>
												<td className={ detailClass( 'request', block.uri ) }>
													{ block.uri ? (
														<code title={ block.uri }>{ block.uri }</code>
													) : (
														NOT_LOGGED
													) }
												</td>
												<td className={ detailClass( 'client', block.userAgent ) }>
													{ block.userAgent ? (
														<span title={ block.userAgent }>
															{ summarizeUserAgent( block.userAgent ) }
														</span>
													) : (
														NOT_LOGGED
													) }
												</td>
											</>
										) }
									</tr>
								) ) }
							</tbody>
						</table>
					</Dialog.Content>
				</Dialog.Popup>
			</Dialog.Root>
		</Stack>
	);
}
