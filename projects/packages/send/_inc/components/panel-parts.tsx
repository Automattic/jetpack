import { Children } from '@wordpress/element';
import { Card, Stack, Text } from '@wordpress/ui';
import type { LogAddress } from '../data/types';
import type { ReactNode } from 'react';
import './panel-parts.scss';

/**
 * An address as "Name <email>", or the email alone.
 *
 * @param address       - The address.
 * @param address.email - Email address.
 * @param address.name  - Display name.
 * @return The text.
 */
export const formatAddress = ( { email, name }: LogAddress ) =>
	name ? `${ name } <${ email }>` : email;

/**
 * A card with a small heading, as on Newsletter › Subscribers' side panel.
 *
 * @param props          - Component props.
 * @param props.title    - The section's title.
 * @param props.children - The section.
 * @return The card.
 */
export const PanelSection = ( { title, children }: { title: string; children: ReactNode } ) => (
	<Card.Root className="jetpack-send-panel__section">
		<Card.Header>
			<Card.Title>
				<Text variant="heading-sm" render={ <h3 /> }>
					{ title }
				</Text>
			</Card.Title>
		</Card.Header>
		<Card.Content>{ children }</Card.Content>
	</Card.Root>
);

/**
 * The `dl` that holds `PanelRow`s.
 *
 * @param props           - Component props.
 * @param props.children  - The rows.
 * @param props.className - Extra class.
 * @return The list.
 */
export const PanelRows = ( {
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
} ) => (
	<Stack
		direction="column"
		gap="md"
		render={ <dl /> }
		className={ [ 'jetpack-send-panel__rows', className ].filter( Boolean ).join( ' ' ) }
	>
		{ children }
	</Stack>
);

/**
 * Whether a value renders nothing: null, undefined, false, '' or a list of only those.
 *
 * @param children - The value.
 * @return True when there's nothing to show.
 */
const isEmpty = ( children: ReactNode ) =>
	Children.toArray( children ).every( part => part === '' );

/**
 * One label and value; empty values leave no row behind. Long values (an ID, a sentence) sit under
 * their label, starting at the left, so a wrapped value doesn't read as a ragged block.
 *
 * @param props          - Component props.
 * @param props.label    - The label.
 * @param props.children - The value.
 * @param props.stacked  - Put the value under the label.
 * @return The row, or null.
 */
export const PanelRow = ( {
	label,
	children,
	stacked = false,
}: {
	label: string;
	children: ReactNode;
	stacked?: boolean;
} ) => {
	if ( isEmpty( children ) ) {
		return null;
	}
	return (
		<Stack
			direction={ stacked ? 'column' : 'row' }
			align={ stacked ? 'stretch' : 'center' }
			justify="space-between"
			gap={ stacked ? 'xs' : 'md' }
			wrap={ stacked ? undefined : 'wrap' }
			className={ `jetpack-send-panel__row${ stacked ? ' jetpack-send-panel__row--stacked' : '' }` }
		>
			<Text variant="body-md" render={ <dt /> } className="jetpack-send-muted">
				{ label }
			</Text>
			<Text variant="body-md" render={ <dd /> } className="jetpack-send-panel__value">
				{ children }
			</Text>
		</Stack>
	);
};
