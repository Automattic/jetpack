import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, InputControl, Stack } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	title: string;
	description: string;
	onChange: ( partial: { title?: string; description?: string } ) => void;
};

/**
 * Form card for the editable text fields: title and description.
 *
 * @param props             - Component props.
 * @param props.title       - Current title value.
 * @param props.description - Current description value.
 * @param props.onChange    - Partial-update handler from the form hook.
 * @return The card element.
 */
export default function VideoDetailsCard( { title, description, onChange }: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Video details', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<InputControl
						label={ __( 'Title', 'jetpack-videopress-pkg' ) }
						value={ title }
						onValueChange={ next => onChange( { title: next } ) }
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Description', 'jetpack-videopress-pkg' ) }
						value={ description }
						onChange={ next => onChange( { description: next } ) }
						rows={ 5 }
					/>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
