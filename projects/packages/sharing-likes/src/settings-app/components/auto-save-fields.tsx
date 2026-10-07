import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { useSettings } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import { SettingGroup } from './section-card';
import type { SettingKey, Settings } from '../types';
import type { JSX } from 'react';

/**
 * One row per field, each saving its change as it happens; only the fields `settings` offers render.
 *
 * @param props        - Props.
 * @param props.fields - Fields, in display order.
 * @return The rows, or null when none of the fields are offered.
 */
export function AutoSaveFields( { fields }: { fields: Field< Settings >[] } ): JSX.Element | null {
	const settings = useSettings();
	const save = useSaveSetting();

	const handleChange = useCallback(
		( edits: Partial< Settings > ) => {
			for ( const [ key, value ] of Object.entries( edits ) ) {
				save( key as SettingKey, value as never );
			}
		},
		[ save ]
	);

	const offered = fields.filter( field => settings && field.id in settings );
	if ( ! settings || offered.length === 0 ) {
		return null;
	}

	return (
		<>
			{ offered.map( field => (
				<SettingGroup key={ field.id }>
					<DataForm< Settings >
						data={ settings }
						fields={ [ field ] }
						form={ { layout: { type: 'regular', labelPosition: 'top' }, fields: [ field.id ] } }
						onChange={ handleChange }
					/>
				</SettingGroup>
			) ) }
		</>
	);
}
