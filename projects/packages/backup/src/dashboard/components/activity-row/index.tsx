import { dateI18n } from '@wordpress/date';
import { useCallback } from '@wordpress/element';
import { Icon, cloud, image, post, plugins as pluginsIcon, color } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import { isBackupItem } from '../../types/activity';
import './style.scss';
import type { ActivityItem, ActivityKind } from '../../types/activity';

const ICON_BY_KIND: Record< ActivityKind, typeof cloud > = {
	backup: cloud,
	upload: image,
	post,
	'plugin-update': pluginsIcon,
	'theme-update': color,
};

type Props = {
	item: ActivityItem;
	isSelected: boolean;
	onSelect: ( id: string ) => void;
};

/**
 * One row in the Overview activity list.
 *
 * Renders as a `<button>` so the entire row is keyboard-activatable and
 * communicates selection through `aria-pressed`. Backup rows surface their
 * `rewindId` to the parent's `onSelect` callback so the right pane can
 * resolve the backup detail; all other rows pass their plain `id`.
 *
 * @param props            - Component props.
 * @param props.item       - Activity item to render.
 * @param props.isSelected - Whether this row is currently selected.
 * @param props.onSelect   - Callback invoked with the selection id when the row is clicked.
 * @return The rendered row.
 */
export default function ActivityRow( { item, isSelected, onSelect }: Props ) {
	const handleClick = useCallback( () => {
		if ( isBackupItem( item ) ) {
			onSelect( item.rewindId );
		} else {
			onSelect( item.id );
		}
	}, [ item, onSelect ] );

	return (
		<button
			type="button"
			className={ `jpb-activity-row${ isSelected ? ' is-selected' : '' }` }
			aria-pressed={ isSelected }
			onClick={ handleClick }
		>
			<Icon icon={ ICON_BY_KIND[ item.kind ] } className="jpb-activity-row__icon" />
			<Stack direction="column" gap="2xs" className="jpb-activity-row__body">
				<Text weight="600">{ item.title }</Text>
				<Text size="small" variant="muted">
					{ dateI18n( 'M j, Y, g:i A', item.publishedAt, undefined ) }
					{ item.summary && (
						<>
							{ '   ' }
							<span className="jpb-activity-row__summary">{ item.summary }</span>
						</>
					) }
				</Text>
			</Stack>
		</button>
	);
}
