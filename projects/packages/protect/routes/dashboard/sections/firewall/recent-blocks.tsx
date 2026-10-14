import { dateI18n, humanTimeDiff } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Dialog, Stack } from '@wordpress/ui';
import { Stat } from '../../components/card';
import { SELF_CHECK_RULE_ID, getBlockLabel } from './firewall-test';
import { summarizeUserAgent } from './user-agent';
import type { BlockedRequest } from './types';

const detailClass = ( column: string, value?: string ) =>
	`jp-protect-blocks-table__${ column }${ value ? '' : ' is-empty' }`;

const NOT_LOGGED = <span className="jp-protect-card__muted">—</span>;

const formatTime = ( block: BlockedRequest ) => (
	<time dateTime={ block.timestamp }>{ dateI18n( 'M j, g:i A', block.timestamp, undefined ) }</time>
);

/**
 * When the firewall last blocked a request, and a dialog listing its recent blocks.
 *
 * @param props        - Component props.
 * @param props.blocks - The blocked requests, newest first.
 * @return The figure and dialog.
 */
export default function RecentBlocks( { blocks }: { blocks: BlockedRequest[] } ) {
	const [ latest ] = blocks;
	const [ , setTick ] = useState( 0 );

	// "A few seconds ago" goes stale; re-render so it keeps up.
	const hasLatest = !! latest;
	useEffect( () => {
		if ( ! hasLatest ) {
			return;
		}
		const timer = setInterval( () => setTick( tick => tick + 1 ), 30000 );
		return () => clearInterval( timer );
	}, [ hasLatest ] );
	const hasDetails = blocks.some( block => block.uri || block.userAgent );

	return (
		<Stack direction="column" gap="md" align="start">
			<Stat
				label={ __( 'Latest blocked request', 'jetpack-protect-pkg' ) }
				value={
					latest ? (
						<time
							dateTime={ latest.timestamp }
							title={ dateI18n( 'M j, Y g:i A', latest.timestamp, undefined ) }
						>
							{ humanTimeDiff( latest.timestamp ) }
						</time>
					) : (
						__( 'None yet', 'jetpack-protect-pkg' )
					)
				}
			/>
			{ latest && (
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
							<Dialog.CloseIcon />
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
			) }
		</Stack>
	);
}
