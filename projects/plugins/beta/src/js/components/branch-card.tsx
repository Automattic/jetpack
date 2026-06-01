/**
 * BranchCard — displays a single branch with its version label and an Activate button.
 *
 * @package
 */

import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { activateBranch, errorMessage } from '../api/abilities';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';

type Props = {
	card: BranchCardType;
	pluginSlug: string;
	onActivated: ( view: PluginView ) => void;
	/**
	 * Optional primary label. When set (used for the fixed single-branch
	 * sections), it replaces the standalone section heading and the branch's
	 * own version is shown as a secondary line only when it adds information.
	 */
	title?: string;
};

/**
 * Renders a branch card with version label, active badge, and activate button.
 *
 * @param {Props} props - Component props.
 * @return The branch card element.
 */
const BranchCard = ( { card, pluginSlug, onActivated, title }: Props ) => {
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const version = card.pretty_version ?? card.branch ?? card.version ?? '';
	const label = title ?? version;
	// Only show the version as a secondary line when a title is given and the
	// version actually differs from it (avoids "Release Candidate / Release Candidate").
	const detail = title && version && version !== title ? version : null;

	const handleActivate = useCallback( () => {
		if ( busy ) {
			return;
		}
		setBusy( true );
		setError( null );
		activateBranch( pluginSlug, card.source ?? '', card.id ?? '' )
			.then( result => {
				onActivated( result.plugin );
			} )
			.catch( ( err: unknown ) => {
				setError( errorMessage( err, __( 'Could not activate branch.', 'jetpack-beta' ) ) );
			} )
			.finally( () => {
				setBusy( false );
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- re-entry is prevented by `disabled={ busy }` on the Button; the in-handler `if (busy) return` is a secondary guard only
	}, [ card.id, card.source, onActivated, pluginSlug ] );

	return (
		<Card.Root>
			<Card.Content>
				{ error && (
					<Notice.Root intent="error">
						<Notice.Description>{ error }</Notice.Description>
					</Notice.Root>
				) }
				<Stack direction="row" align="center" justify="space-between">
					<Stack direction="column" gap="xs">
						<Stack direction="row" gap="xs" align="center">
							<Text variant="body-md">{ label }</Text>
							{ card.is_active && (
								<Badge intent="informational">{ __( 'Active', 'jetpack-beta' ) }</Badge>
							) }
						</Stack>
						{ detail && <Text variant="body-sm">{ detail }</Text> }
					</Stack>
					{ ! card.is_active && (
						<Button
							variant="outline"
							tone="neutral"
							size="compact"
							disabled={ busy }
							loading={ busy }
							loadingAnnouncement={ __( 'Activating…', 'jetpack-beta' ) }
							onClick={ handleActivate }
						>
							{ busy ? __( 'Activating…', 'jetpack-beta' ) : __( 'Activate', 'jetpack-beta' ) }
						</Button>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default BranchCard;
