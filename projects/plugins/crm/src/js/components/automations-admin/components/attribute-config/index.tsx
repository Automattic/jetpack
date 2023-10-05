import {
	CheckboxControl,
	DatePicker,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { store } from 'crm/state/store';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import type { AttributeDefinition, AttributeValue } from 'crm/state/automations-admin/types';

type AttributeConfigProps = {
	workflowId: number;
	stepId: string;
	value: AttributeValue;
	definition: AttributeDefinition;
};

type NewValue = string | number | boolean;

export const AttributeConfig: React.FC< AttributeConfigProps > = ( {
	workflowId,
	stepId,
	value,
	definition,
} ) => {
	const onChange = useCallback(
		( newValue: NewValue ) =>
			dispatch( store ).setAttribute( workflowId, stepId, definition.slug, newValue ),
		[ workflowId, stepId, definition.slug ]
	);

	const editValue = getEditValue( value, definition, onChange );

	return (
		<div className={ styles.container }>
			{ definition.type !== 'checkbox' && (
				<div className={ styles.title }>{ definition.title }</div>
			) }
			{ editValue }
		</div>
	);
};

const getEditValue = (
	value: AttributeValue,
	definition: AttributeDefinition,
	onChange: ( newValue: NewValue ) => void
) => {
	switch ( definition.type ) {
		case 'select':
			return (
				<SelectControl
					options={
						definition.data
							? Object.entries( definition.data ).map( ( [ key, label ] ) => ( {
									value: key,
									label,
							  } ) )
							: []
					}
					value={ value }
					onChange={ onChange }
				/>
			);
		case 'text':
			return <TextControl value={ value } onChange={ onChange } />;
		case 'checkbox':
			return (
				<CheckboxControl
					label={ definition.title }
					checked={ value as boolean }
					onChange={ onChange }
				/>
			);
		case 'textarea':
			return <TextareaControl value={ value as string } onChange={ onChange } />;
		case 'date':
			return (
				<div className={ styles.datepicker }>
					<DatePicker
						currentDate={ value ? new Date( value as string | number ) : new Date() }
						onChange={ ( selectedDate: string ) => {
							// selectedDate is a string in the format `YYYY-MM-DDTHH:MM:SS` but CRM
							// is using timestamps, so we pass it to a Date object before converting
							// it back to a timestamp for Redux.
							const newDate = new Date( selectedDate );
							onChange( newDate.getTime() );
						} }
					/>
				</div>
			);
		case 'number':
			return <TextControl type="number" value={ value } onChange={ onChange } />;
		default:
			return `${ definition.type } is not implemented`;
	}
};
