import { TextareaControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, InputControl, Link, Stack } from '@wordpress/ui';
import type { ReactElement } from 'react';

type Props = {
	title: string;
	description: string;
	onChange: ( partial: { title?: string; description?: string } ) => void;
	onOpenChapters: () => void;
};

/**
 * Form card for the editable text fields: title and description.
 * Renders a footer hint that opens the Chapters help modal.
 *
 * @param props                - Component props.
 * @param props.title          - Current title value.
 * @param props.description    - Current description value.
 * @param props.onChange       - Partial-update handler from the form hook.
 * @param props.onOpenChapters - Opens the chapters help modal.
 * @return The card element.
 */
export default function VideoDetailsCard( {
	title,
	description,
	onChange,
	onOpenChapters,
}: Props ): ReactElement {
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
					<p className="vp-video-details__chapters-hint">
						{ createInterpolateElement(
							__(
								'Did you know you can now add Chapters to your videos? <link>Learn how</link>',
								'jetpack-videopress-pkg'
							),
							{
								link: (
									<Link
										href="#"
										onClick={ event => {
											event.preventDefault();
											onOpenChapters();
										} }
									/>
								),
							}
						) }
					</p>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
