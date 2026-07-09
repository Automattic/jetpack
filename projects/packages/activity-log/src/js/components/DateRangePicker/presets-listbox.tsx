/**
 * Keyboard-navigable list of date-range presets. Verbatim port of
 * Calypso's `client/dashboard/components/date-range-picker/presets-listbox.tsx`
 * with a local `utils` import.
 */
import {
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Composite,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { presetDefs } from './utils';
import type { PresetId } from './utils';

type PresetsListboxProps = {
	labelId: string;
	activePresetId?: PresetId;
	onSelect: ( id: PresetId ) => void;
	compositeActiveId: string | null;
	setCompositeActiveId: ( id: string | null ) => void;
};

/**
 *
 * @param root0
 * @param root0.labelId
 * @param root0.activePresetId
 * @param root0.onSelect
 * @param root0.compositeActiveId
 * @param root0.setCompositeActiveId
 */
export function PresetsListbox( {
	labelId,
	activePresetId,
	onSelect,
	compositeActiveId,
	setCompositeActiveId,
}: PresetsListboxProps ) {
	const items: ReadonlyArray< { id: PresetId; label: string } > = [
		...presetDefs,
		{ id: 'custom' as const, label: __( 'Custom', 'jetpack-activity-log' ) },
	];

	return (
		<VStack justify="flex-start" alignment="stretch" spacing={ 1 } className="daterange-presets">
			<VisuallyHidden id={ labelId }>
				{ __( 'Date range presets', 'jetpack-activity-log' ) }
			</VisuallyHidden>
			<Composite
				aria-labelledby={ labelId }
				activeId={ compositeActiveId ?? undefined }
				setActiveId={ id => setCompositeActiveId( id ?? null ) }
				focusLoop
				virtualFocus
				role="listbox"
			>
				<VStack justify="flex-start" alignment="stretch" spacing={ 1 }>
					{ items.map( preset => {
						const isSelected = activePresetId === preset.id;
						return (
							<Composite.Item
								key={ preset.id }
								id={ preset.id }
								render={ <Button size="compact" variant={ isSelected ? 'primary' : undefined } /> }
								onClick={ () => onSelect( preset.id ) }
								role="option"
								aria-selected={ isSelected || undefined }
								className="preset-listbox__item"
							>
								{ preset.label }
							</Composite.Item>
						);
					} ) }
				</VStack>
			</Composite>
		</VStack>
	);
}
