import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Field, Link, Radio, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import './style.scss';
import type { RadioCardGridProps, RadioCardProps } from './types.ts';
import type { JSX } from 'react';

/**
 * Lays out radio cards in two columns, or one on narrow screens.
 *
 * @param {RadioCardGridProps} props - Component props.
 * @return {JSX.Element} The grid.
 */
export function RadioCardGrid( { children, className }: RadioCardGridProps ): JSX.Element {
	return <div className={ clsx( 'jp-radio-card-grid', className ) }>{ children }</div>;
}

/**
 * A card with a radio, picked by a click on its illustration. Render it in a `RadioGroup` inside a `Field.Root`.
 *
 * @param {RadioCardProps} props - Component props.
 * @return {JSX.Element} The card.
 */
export default function RadioCard( {
	id,
	value,
	title,
	illustration,
	previewUrl,
	onPreviewClick,
	disabled,
}: RadioCardProps ): JSX.Element {
	const titleId = `${ id }__title`;

	const handlePreviewClick = useCallback( () => {
		onPreviewClick?.( value );
	}, [ value, onPreviewClick ] );

	return (
		<Field.Item disabled={ disabled }>
			<Card.Root className="jp-radio-card">
				<Card.Content>
					<Card.FullBleed className="jp-radio-card__surface">
						{ /* Only the illustration picks the card: the title and link sit outside the label. */ }
						<Field.Label className="jp-radio-card__illustration">{ illustration }</Field.Label>
						<Radio
							id={ id }
							className="jp-radio-card__radio"
							value={ value }
							disabled={ disabled }
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
		</Field.Item>
	);
}

export { RadioCard };
export type { RadioCardProps, RadioCardGridProps };
