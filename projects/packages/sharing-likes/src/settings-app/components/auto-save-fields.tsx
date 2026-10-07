import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { useSettings } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import type { SettingKey, Settings } from '../types';
import type { JSX } from 'react';

/**
 * A DataForm that saves each change as it happens, showing only the fields `settings` offers.
 *
 * @param props        - Props.
 * @param props.fields - Fields, in display order.
 * @return The form, or null when none of its fields are offered.
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
		<DataForm< Settings >
			data={ settings }
			fields={ offered }
			form={ {
				layout: { type: 'regular', labelPosition: 'top' },
				fields: offered.map( field => field.id ),
			} }
			onChange={ handleChange }
		/>
	);
}
