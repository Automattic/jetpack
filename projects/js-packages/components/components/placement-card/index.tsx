import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Checkbox, Field, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import './style.scss';
import type { PlacementCardGridProps, PlacementCardProps } from './types.ts';
import type { JSX } from 'react';

/**
 * Lays out placement cards in two columns, or one on narrow screens.
 *
 * @param {PlacementCardGridProps} props - Component props.
 * @return {JSX.Element} The grid.
 */
export function PlacementCardGrid( { children, className }: PlacementCardGridProps ): JSX.Element {
	return <div className={ clsx( 'jp-placement-card-grid', className ) }>{ children }</div>;
}

/**
 * A selectable card showing where something will appear on the site.
 *
 * @param {PlacementCardProps} props - Component props.
 * @return {JSX.Element} The card.
 */
export default function PlacementCard( {
	id,
	name,
	title,
	illustration,
	checked,
	onChange,
	previewUrl,
	onPreviewClick,
	disabled,
}: PlacementCardProps ): JSX.Element {
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
			<Card.Root className="jp-placement-card" data-checked={ checked }>
				<Card.Content>
					<Card.FullBleed className="jp-placement-card__surface">
						{ /* Only the illustration toggles: the title and link sit outside the label. */ }
						<Field.Label className="jp-placement-card__illustration">{ illustration }</Field.Label>
						<Checkbox
							id={ id }
							className="jp-placement-card__checkbox"
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

export { PlacementCard };
export type { PlacementCardProps, PlacementCardGridProps };
