import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Checkbox, Field, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import './style.scss';
import type { CheckboxCardGridProps, CheckboxCardProps } from './types.ts';
import type { JSX } from 'react';

/**
 * Lays out checkbox cards in two columns, or one on narrow screens.
 *
 * @param {CheckboxCardGridProps} props - Component props.
 * @return {JSX.Element} The grid.
 */
export function CheckboxCardGrid( { children, className }: CheckboxCardGridProps ): JSX.Element {
	return <div className={ clsx( 'jp-checkbox-card-grid', className ) }>{ children }</div>;
}

/**
 * A card with a checkbox, toggled by a click on its illustration.
 *
 * @param {CheckboxCardProps} props - Component props.
 * @return {JSX.Element} The card.
 */
export default function CheckboxCard( {
	id,
	name,
	title,
	illustration,
	checked,
	onChange,
	previewUrl,
	onPreviewClick,
	disabled,
}: CheckboxCardProps ): JSX.Element {
	const titleId = `${ id }__title`;

	const handleChange = useCallback(
		( next: boolean ) => onChange( name, next ),
		[ name, onChange ]
	);

	const handlePreviewClick = useCallback( () => {
		onPreviewClick?.( name );
	}, [ name, onPreviewClick ] );

	return (
		<Field.Root disabled={ disabled }>
			<Card.Root className="jp-checkbox-card" data-checked={ checked }>
				<Card.Content>
					<Card.FullBleed className="jp-checkbox-card__surface">
						{ /* Only the illustration toggles: the title and link sit outside the label. */ }
						<Field.Label className="jp-checkbox-card__illustration">{ illustration }</Field.Label>
						<Checkbox
							id={ id }
							className="jp-checkbox-card__checkbox"
							checked={ checked }
							onCheckedChange={ handleChange }
							aria-labelledby={ titleId }
						/>
					</Card.FullBleed>
				</Card.Content>
			</Card.Root>
			<Stack gap="xs" direction="column">
				<Text id={ titleId } variant="body-sm">
					{ title }
				</Text>
				{ previewUrl && (
					<Link href={ previewUrl } onClick={ handlePreviewClick }>
						{ __( 'Preview and edit', 'jetpack-components' ) }
					</Link>
				) }
			</Stack>
		</Field.Root>
	);
}

export { CheckboxCard };
export type { CheckboxCardProps, CheckboxCardGridProps };
