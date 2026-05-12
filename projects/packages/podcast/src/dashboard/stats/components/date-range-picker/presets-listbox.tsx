/**
 * Keyboard-navigable list of date-range presets. Mirrors the
 * activity-log port of Calypso's
 * `client/dashboard/components/date-range-picker/presets-listbox.tsx`.
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
	hiddenPresets?: PresetId[];
};

/**
 * Render the preset listbox.
 *
 * @param props                      - Props.
 * @param props.labelId
 * @param props.activePresetId
 * @param props.onSelect
 * @param props.compositeActiveId
 * @param props.setCompositeActiveId
 * @param props.hiddenPresets
 * @return      Element.
 */
export function PresetsListbox( {
	labelId,
	activePresetId,
	onSelect,
	compositeActiveId,
	setCompositeActiveId,
	hiddenPresets,
}: PresetsListboxProps ) {
	const items: ReadonlyArray< { id: PresetId; label: string } > = [
		...presetDefs,
		{ id: 'custom' as const, label: __( 'Custom', 'jetpack-podcast' ) },
	].filter( preset => ! hiddenPresets?.includes( preset.id ) );

	return (
		<VStack justify="flex-start" alignment="stretch" spacing={ 1 } className="daterange-presets">
			<VisuallyHidden id={ labelId }>
				{ __( 'Date range presets', 'jetpack-podcast' ) }
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
