import { Badge, Icon, Stack, Text } from '@wordpress/ui';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

export type CardStatus = { label: string; intent: ComponentProps< typeof Badge >[ 'intent' ] };

type CardProps = {
	icon: ReactElement;
	title: string;
	status?: CardStatus;
	actions?: ReactNode;
	children: ReactNode;
};

/**
 * A Protect dashboard card: a titled header, then rows divided by rules.
 *
 * @param props          - Component props.
 * @param props.icon     - The feature's icon.
 * @param props.title    - The feature's name.
 * @param props.status   - Optional status badge.
 * @param props.actions  - Optional controls beside the badge.
 * @param props.children - The card's rows.
 * @return The card.
 */
export function ProtectCard( { icon, title, status, actions, children }: CardProps ) {
	return (
		<section className="jp-protect-card" aria-label={ title }>
			<Stack
				className="jp-protect-card__header"
				direction="row"
				gap="sm"
				align="center"
				justify="space-between"
			>
				<Stack direction="row" gap="sm" align="center">
					<Icon icon={ icon } size={ 24 } />
					<Text variant="heading-md" render={ <h2 className="jp-protect-card__title" /> }>
						{ title }
					</Text>
				</Stack>
				<Stack direction="row" gap="sm" align="center">
					{ status && <Badge intent={ status.intent }>{ status.label }</Badge> }
					{ actions }
				</Stack>
			</Stack>
			{ children }
		</section>
	);
}

/**
 * One row of a card.
 *
 * @param props           - Component props.
 * @param props.children  - Row contents.
 * @param props.className - Extra class names.
 * @return The row.
 */
export function CardRow( {
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
} ) {
	return <div className={ `jp-protect-card__row ${ className }`.trim() }>{ children }</div>;
}

/**
 * A labelled figure, such as a count of blocked requests.
 *
 * @param props         - Component props.
 * @param props.label   - What the figure counts.
 * @param props.value   - The figure.
 * @param props.warning - Whether to highlight the figure as needing attention.
 * @return The stat.
 */
export function Stat( {
	label,
	value,
	warning = false,
}: {
	label: string;
	value: ReactNode;
	warning?: boolean;
} ) {
	return (
		<Stack direction="column" gap="xs">
			<Text variant="body-md">{ label }</Text>
			<Text
				variant="heading-2xl"
				className={
					warning ? 'jp-protect-card__stat-value is-warning' : 'jp-protect-card__stat-value'
				}
			>
				{ value }
			</Text>
		</Stack>
	);
}
