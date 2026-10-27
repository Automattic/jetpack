import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Dialog } from '@wordpress/ui';
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
 * A View log button, and the dialog listing the firewall's recent blocks it opens.
 *
 * @param props        - Component props.
 * @param props.blocks - The blocked requests, newest first.
 * @return The button and dialog, or nothing before anything is blocked.
 */
export default function RecentBlocks( { blocks }: { blocks: BlockedRequest[] } ) {
	if ( ! blocks.length ) {
		return null;
	}
	const hasDetails = blocks.some( block => block.uri || block.userAgent );

	return (
		<Dialog.Root>
			<Dialog.Trigger render={ <Button variant="outline" size="compact" /> }>
				{ __( 'View log', 'jetpack-protect-pkg' ) }
			</Dialog.Trigger>
			<Dialog.Popup size="large">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Recently blocked requests', 'jetpack-protect-pkg' ) }</Dialog.Title>
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
												{ block.uri ? <code title={ block.uri }>{ block.uri }</code> : NOT_LOGGED }
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
	);
}
