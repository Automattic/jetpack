/**
 * External dependencies
 */
import { Button, Icon, Menu, Stack, Text } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { useId } from 'react';
/**
 * Internal dependencies
 */
import styles from './role-select.module.scss';

type RoleSelectProps = {
	label: string;
	roles: Array< { slug: string; name: string } >;
	value: string[];
	onChange: ( value: string[] ) => void;
	/** A role that stays selected and cannot be cleared. */
	lockedRole?: string;
	disabled?: boolean;
};

/**
 * A dropdown of site roles, each one checked or not.
 *
 * @param props            - Component props.
 * @param props.label      - The visible label above the dropdown.
 * @param props.roles      - The site's roles, in display order.
 * @param props.value      - The selected role slugs.
 * @param props.onChange   - Called with the new list of selected slugs.
 * @param props.lockedRole - A role that stays selected and cannot be cleared.
 * @param props.disabled   - Whether the dropdown is disabled.
 * @return The labelled dropdown.
 */
export function RoleSelect( {
	label,
	roles,
	value,
	onChange,
	lockedRole,
	disabled,
}: RoleSelectProps ) {
	const labelId = useId();
	const valueId = useId();
	const isSelected = ( slug: string ) => slug === lockedRole || value.includes( slug );
	const selectedNames = roles
		.filter( ( { slug } ) => isSelected( slug ) )
		.map( ( { name } ) => name );

	let summary = selectedNames.join( ', ' );
	if ( selectedNames.length === 0 ) {
		summary = __( 'No roles', 'jetpack-premium-analytics-pkg' );
	} else if ( selectedNames.length === roles.length ) {
		summary = __( 'All roles', 'jetpack-premium-analytics-pkg' );
	}

	return (
		<Stack direction="column" gap="sm" align="start">
			<Text id={ labelId }>{ label }</Text>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							variant="outline"
							tone="neutral"
							disabled={ disabled }
							aria-labelledby={ `${ labelId } ${ valueId }` }
							className={ styles.trigger }
						/>
					}
				>
					<span id={ valueId }>{ summary }</span>
					<Icon icon={ chevronDown } />
				</Menu.Trigger>
				<Menu.Popup>
					{ roles.map( ( { slug, name } ) => (
						<Menu.CheckboxItem
							key={ slug }
							checked={ isSelected( slug ) }
							disabled={ slug === lockedRole }
							onCheckedChange={ ( checked: boolean ) =>
								onChange( checked ? [ ...value, slug ] : value.filter( role => role !== slug ) )
							}
						>
							<Menu.ItemLabel>{ name }</Menu.ItemLabel>
						</Menu.CheckboxItem>
					) ) }
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
