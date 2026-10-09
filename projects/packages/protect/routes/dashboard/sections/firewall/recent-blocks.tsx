import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { getBlockLabel } from './firewall-test';
import type { BlockedRequest } from './types';

/**
 * The firewall's most recent blocked requests.
 *
 * @param props        - Component props.
 * @param props.blocks - The blocked requests, newest first.
 * @return The list.
 */
export default function RecentBlocks( { blocks }: { blocks: BlockedRequest[] } ) {
	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'Recently blocked requests', 'jetpack-protect-pkg' ) }
			</Text>
			{ blocks.length === 0 ? (
				<Text variant="body-md" className="jp-protect-card__muted">
					{ __( 'No blocked requests yet.', 'jetpack-protect-pkg' ) }
				</Text>
			) : (
				<ul className="jp-protect-recent-blocks">
					{ blocks.map( block => (
						<li key={ block.id } className="jp-protect-recent-blocks__item">
							<Stack direction="column" gap="xs" className="jp-protect-recent-blocks__request">
								<Text variant="body-md">{ getBlockLabel( block ) }</Text>
								{ block.uri && (
									<code className="jp-protect-recent-blocks__uri" title={ block.uri }>
										{ [ block.method, block.uri ].filter( Boolean ).join( ' ' ) }
									</code>
								) }
								{ block.userAgent && (
									<Text variant="body-sm" className="jp-protect-card__muted">
										{ block.userAgent }
									</Text>
								) }
							</Stack>
							<Text variant="body-sm" className="jp-protect-card__muted">
								<time dateTime={ block.timestamp }>
									{ dateI18n( 'M j, g:i A', block.timestamp, undefined ) }
								</time>
							</Text>
						</li>
					) ) }
				</ul>
			) }
		</Stack>
	);
}
