/* @jsxImportSource react */
import { ToggleControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import type { ModuleOverrides, Settings } from './types';
import type { DeepPartial, NormalizedField } from '@wordpress/dataviews';
import type { JSX, ReactNode } from 'react';

/**
 * One section of the screen, as Newsletter's settings cards: a title, an optional description, then its settings.
 *
 * @param props             - Props.
 * @param props.title       - Heading.
 * @param props.description - What the section is for.
 * @param props.children    - Settings.
 * @return Card.
 */
export function SectionCard( {
	title,
	description,
	children,
}: {
	title: string;
	description?: ReactNode;
	children: ReactNode;
} ): JSX.Element {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="xl">
					{ description && <Text render={ <p /> }>{ description }</Text> }
					{ children }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Why a module's toggle is locked, in the words Jetpack's dashboard uses.
 *
 * @param override - The module's override, if a filter forces it.
 * @return Note, or undefined when nothing forces it.
 */
export function overrideNote(
	override: ModuleOverrides[ keyof ModuleOverrides ]
): string | undefined {
	if ( override === 'active' ) {
		return __( 'This feature has been enabled by a site administrator.', 'jetpack-comments' );
	}
	if ( override === 'inactive' ) {
		return __( 'This feature has been disabled by a site administrator.', 'jetpack-comments' );
	}
	return undefined;
}

/**
 * DataForm `Edit` for a boolean setting, as a toggle. Reads through the field's `getValue`.
 *
 * @param props          - Edit props.
 * @param props.data     - Settings.
 * @param props.field    - Field.
 * @param props.onChange - Called with the edit.
 * @return Control.
 */
export function ToggleEdit( {
	data,
	field,
	onChange,
}: {
	data: Settings;
	field: NormalizedField< Settings >;
	onChange: ( value: DeepPartial< Settings > ) => void;
} ): JSX.Element {
	const checked = Boolean( field.getValue( { item: data } ) );
	const handleChange = useCallback(
		( next: boolean ) => onChange( { [ field.id ]: next } as DeepPartial< Settings > ),
		[ field.id, onChange ]
	);

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ field.label }
			help={ field.description }
			checked={ checked }
			disabled={ field.isDisabled( { item: data, field } ) }
			onChange={ handleChange }
		/>
	);
}
