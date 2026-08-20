/**
 * WordPress dependencies
 */
import { Button, Fieldset, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { CheckboxControl, privateApis, Spinner } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useElements from '../helpers/use-elements';
import { unlock } from '../lock/unlock';
import styles from './array-checkbox-field.module.css';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

const { Menu } = unlock( privateApis );

function normalizeSelectedValues( value: unknown ): string[] {
	return Array.isArray( value ) ? value.filter( ( v ): v is string => typeof v === 'string' ) : [];
}

/**
 * Edit control for `type: 'array'` fields with `elements`.
 */
export default function ArrayCheckboxField< Item extends Record< string, string[] | undefined > >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const disabled = field.isDisabled( { item: data, field } );
	const selectedValues = normalizeSelectedValues( getValue( { item: data } ) );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const updateValues = useCallback(
		( nextValues: string[] ) => {
			onChange( setValue( { item: data, value: nextValues } ) );
		},
		[ data, onChange, setValue ]
	);

	const onCheckboxChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const { value, checked } = event.target;
			updateValues(
				checked
					? [ ...selectedValues, value ]
					: selectedValues.filter( selectedValue => selectedValue !== value )
			);
		},
		[ selectedValues, updateValues ]
	);

	const onCheckboxControlChange = useCallback(
		( value: string ) => {
			updateValues(
				selectedValues.includes( value )
					? selectedValues.filter( selectedValue => selectedValue !== value )
					: [ ...selectedValues, value ]
			);
		},
		[ selectedValues, updateValues ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! hideLabelFromVision ) {
		return (
			<Fieldset.Root>
				<Fieldset.Legend>{ label }</Fieldset.Legend>
				{ typeof description === 'string' && (
					<Fieldset.Description>{ description }</Fieldset.Description>
				) }

				<Stack direction="column" gap="sm">
					{ elements.map( element => {
						const value = String( element.value );
						return (
							<CheckboxControl
								key={ value }
								label={ element.label }
								checked={ selectedValues.includes( value ) }
								disabled={ disabled }
								onChange={ () => onCheckboxControlChange( value ) }
							/>
						);
					} ) }
				</Stack>
			</Fieldset.Root>
		);
	}

	return (
		<Menu placement="bottom-end">
			<Menu.TriggerButton
				render={
					<Button
						className={ styles.trigger }
						variant="outline"
						tone="neutral"
						size="compact"
						disabled={ disabled }
					/>
				}
			>
				<span className={ styles.triggerLabel }>{ label }</span>
				<Icon className={ styles.triggerCaret } icon={ chevronDown } size={ 18 } />
			</Menu.TriggerButton>

			<Menu.Popover>
				<Menu.Group>
					{ elements.map( element => {
						const value = String( element.value );
						return (
							<Menu.CheckboxItem
								key={ value }
								className={ styles.menuItem }
								name={ field.id }
								value={ value }
								checked={ selectedValues.includes( value ) }
								onChange={ onCheckboxChange }
							>
								<Menu.ItemLabel>{ element.label }</Menu.ItemLabel>
							</Menu.CheckboxItem>
						);
					} ) }
				</Menu.Group>
			</Menu.Popover>
		</Menu>
	);
}
