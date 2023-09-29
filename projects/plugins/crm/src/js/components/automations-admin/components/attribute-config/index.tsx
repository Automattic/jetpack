import { SelectControl, TextareaControl, TextControl } from '@wordpress/components';
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

export const AttributeConfig: React.FC< AttributeConfigProps > = ( {
	workflowId,
	stepId,
	value,
	definition,
} ) => {
	const onChange = useCallback(
		( newValue: string ) =>
			dispatch( store ).setAttribute( workflowId, stepId, definition.slug, newValue ),
		[ workflowId, stepId, definition.slug ]
	);

	const editValue = getEditValue( value, definition, onChange );

	return (
		<div className={ styles.container }>
			<div className={ styles.title }>{ definition.title }</div>
			{ editValue }
		</div>
	);
};

const getEditValue = (
	value: AttributeValue,
	definition: AttributeDefinition,
	onChange: ( newValue: string ) => void
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
					onChange={ onChange }
				/>
			);
		case 'text':
			return <TextControl value={ value.toString() } onChange={ onChange } />;
		case 'checkbox':
		case 'textarea':
			return <TextareaControl value={ value } onChange={ onChange } />;
		case 'date':
		case 'datetime':
		case 'number':
			return <TextControl type="number" value={ value } onChange={ onChange } />;
		case 'password':
		default:
			return `${ definition.type } is not implemented`;
	}
};
