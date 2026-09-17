import { Card, Icon } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import type { ComponentProps, ReactNode } from 'react';

/**
 * Two-column feature panel: content on the left, illustration on the right.
 *
 * Ported from the WordPress.com dashboard's `Callout`
 * (`client/dashboard/components/callout`), which is what
 * `HostingFeatureGatedWithCallout` renders for this product when it is gated.
 * Every state of this page uses it, so they stay consistent with each other.
 *
 * @param props             - Component props.
 * @param props.icon        - Glyph above the title.
 * @param props.title       - Panel heading.
 * @param props.description - Body copy. Elements are stacked with the title.
 * @param props.image       - Decorative illustration URL, dropped on narrow viewports by CSS.
 * @param props.actions     - Call to action.
 * @return The rendered panel.
 */
export function Callout( {
	icon,
	title,
	description,
	image,
	actions,
}: {
	icon?: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
	description: ReactNode;
	image?: string;
	actions?: ReactNode;
} ) {
	return (
		<Card className="wpcom-backup__callout" role="article">
			<Stack className="wpcom-backup__callout-container" direction="row" gap="xl" align="stretch">
				<Stack
					className="wpcom-backup__callout-content"
					direction="column"
					gap="lg"
					justify="flex-start"
					align="flex-start"
				>
					{ icon && <Icon icon={ icon } /> }
					<Text className="wpcom-backup__callout-title" variant="heading-lg" render={ <h2 /> }>
						{ title }
					</Text>
					{ description }
					{ actions }
				</Stack>
				{ image && (
					<div className="wpcom-backup__callout-image" aria-hidden="true">
						<img src={ image } alt="" />
					</div>
				) }
			</Stack>
		</Card>
	);
}
