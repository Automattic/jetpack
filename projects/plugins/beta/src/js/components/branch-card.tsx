/**
 * BranchCard — displays a single branch with its version label and an Activate button.
 *
 * @package
 */

import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { activateBranch } from '../api/abilities';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';

type Props = {
	card: BranchCardType;
	pluginSlug: string;
	onActivated: ( view: PluginView ) => void;
};

/**
 * Renders a branch card with version label, active badge, and activate button.
 *
 * @param {Props} props - Component props.
 * @return The branch card element.
 */
const BranchCard = ( { card, pluginSlug, onActivated }: Props ) => {
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const label = card.pretty_version ?? card.branch ?? card.version ?? '';

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
				const msg =
					err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
						? err.message
						: __( 'Could not activate branch.', 'jetpack-beta' );
				setError( msg );
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
					<Stack direction="row" gap="xs" align="center">
						<Text variant="body-md">{ label }</Text>
						{ card.is_active && (
							<Badge intent="informational">{ __( 'Active', 'jetpack-beta' ) }</Badge>
						) }
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
