import { CheckboxControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import './style.scss';
import type { RestoreItems } from '../../types/restore';

type Props = {
	value: RestoreItems;
	onChange: ( next: RestoreItems ) => void;
};

type ItemKey = keyof RestoreItems;

type ItemDef = {
	key: ItemKey;
	label: string;
	description?: string;
};

const ITEMS: ItemDef[] = [
	{ key: 'themes', label: __( 'WordPress themes', 'jetpack-backup-pkg' ) },
	{ key: 'plugins', label: __( 'WordPress plugins', 'jetpack-backup-pkg' ) },
	{
		key: 'roots',
		label: __( 'WordPress root', 'jetpack-backup-pkg' ),
		description: __( 'Includes wp-config.php and any non WordPress files.', 'jetpack-backup-pkg' ),
	},
	{
		key: 'contents',
		label: __( 'WP-content directory', 'jetpack-backup-pkg' ),
		description: __( 'Excludes themes, plugins, and uploads.', 'jetpack-backup-pkg' ),
	},
	{
		key: 'sqls',
		label: __( 'Site database', 'jetpack-backup-pkg' ),
		description: __( 'Includes pages, and posts.', 'jetpack-backup-pkg' ),
	},
	{
		key: 'uploads',
		label: __( 'Media uploads', 'jetpack-backup-pkg' ),
		description: __(
			'You must also select Site database for restored media uploads to appear.',
			'jetpack-backup-pkg'
		),
	},
];

type RowProps = {
	item: ItemDef;
	value: RestoreItems;
	onChange: ( next: RestoreItems ) => void;
};

/**
 * Single row of the restore checklist: a labeled checkbox plus an optional
 * muted description below it. Lives in its own component so the per-item
 * `onChange` handler can be memoized via `useCallback` and satisfy
 * `react/jsx-no-bind`.
 *
 * @param props          - Component props.
 * @param props.item     - The item definition (key, label, optional description).
 * @param props.value    - Current state of every toggle in the parent checklist.
 * @param props.onChange - Called with the next state when this row's toggle flips.
 * @return The rendered row.
 */
function ChecklistRow( { item, value, onChange }: RowProps ) {
	const handleChange = useCallback(
		( next: boolean ) => onChange( { ...value, [ item.key ]: next } ),
		[ onChange, value, item.key ]
	);

	return (
		<Stack direction="column" gap="xs" className="jpb-restore-checklist__row">
			<CheckboxControl
				checked={ value[ item.key ] }
				label={ item.label }
				onChange={ handleChange }
				__nextHasNoMarginBottom
			/>
			{ item.description && (
				<Text variant="body-sm" className="jpb-restore-checklist__desc">
					{ item.description }
				</Text>
			) }
		</Stack>
	);
}

/**
 * Six-checkbox toggle list shared by the Restore and Download screens.
 *
 * The keys map to `RestoreItems` (themes/plugins/roots/contents/sqls/uploads);
 * descriptions render as small muted text directly beneath their checkbox.
 *
 * @param props          - Component props.
 * @param props.value    - Current state of each toggle.
 * @param props.onChange - Called with the next state when any toggle flips.
 * @return The rendered checklist.
 */
export default function RestoreItemsChecklist( { value, onChange }: Props ) {
	return (
		<Stack direction="column" gap="lg" className="jpb-restore-checklist">
			{ ITEMS.map( item => (
				<ChecklistRow key={ item.key } item={ item } value={ value } onChange={ onChange } />
			) ) }
		</Stack>
	);
}
