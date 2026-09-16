import { Card, Icon } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import type { JSX, ReactNode } from 'react';

/**
 * Two-column feature panel: content on the left, illustration on the right.
 *
 * Mirrors the WordPress.com dashboard's `Callout`
 * (`client/dashboard/components/callout`), which is what a Simple site sees for
 * this product today.
 *
 * @param props          - Component props.
 * @param props.icon     - Glyph above the title.
 * @param props.title    - Panel heading.
 * @param props.image    - Illustration URL, dropped on narrow viewports by CSS.
 * @param props.children - Body copy.
 * @param props.actions  - Call to action.
 * @return The rendered panel.
 */
export function Callout( {
	icon,
	title,
	image,
	children,
	actions,
}: {
	icon?: JSX.Element;
	title: string;
	image?: string;
	children: ReactNode;
	actions?: ReactNode;
} ) {
	return (
		<Card className="wpcom-simple-backup__callout">
			<Stack direction="row" gap="lg" align="stretch">
				<Stack
					className="wpcom-simple-backup__callout-content"
					direction="column"
					gap="md"
					justify="flex-start"
					align="flex-start"
				>
					{ icon && <Icon icon={ icon } /> }
					<Text variant="heading-lg">{ title }</Text>
					{ children }
					{ actions }
				</Stack>
				{ image && (
					<div className="wpcom-simple-backup__callout-image" aria-hidden="true">
						<img src={ image } alt="" />
					</div>
				) }
			</Stack>
		</Card>
	);
}
