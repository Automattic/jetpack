import { __ } from '@wordpress/i18n';
import { Badge, Card, Icon, Notice, Stack, Text } from '@wordpress/ui';
import type { ProtectSettingsData } from '../data/use-protect-settings';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

export type CardStatus = { label: string; intent: ComponentProps< typeof Badge >[ 'intent' ] };

type CardProps = {
	icon: ReactElement;
	title: string;
	description?: string;
	titleAside?: ReactNode;
	status?: CardStatus;
	actions?: ReactNode;
	children: ReactNode;
};

/**
 * A Protect dashboard card: a titled header, then rows divided by rules.
 *
 * @param props             - Component props.
 * @param props.icon        - The feature's icon.
 * @param props.title       - The feature's name.
 * @param props.description - Optional line under the title.
 * @param props.titleAside  - Optional details beside the title, such as a badge saying when it last ran.
 * @param props.status      - Optional status badge.
 * @param props.actions     - Optional controls beside the badge.
 * @param props.children    - The card's rows.
 * @return The card.
 */
export function ProtectCard( {
	icon,
	title,
	description,
	titleAside,
	status,
	actions,
	children,
}: CardProps ) {
	const cardTitle = (
		<Card.Title render={ <h2 className="jp-protect-card__title" /> }>{ title }</Card.Title>
	);
	return (
		<Card.Root render={ <section /> } className="jp-protect-card" aria-label={ title }>
			<Card.Header
				render={ <Stack direction="row" gap="sm" align="center" justify="space-between" /> }
			>
				<Stack direction="row" gap="sm" align={ description ? 'start' : 'center' }>
					<Icon icon={ icon } size={ 24 } />
					<Stack direction="column" gap="xs">
						{ titleAside ? (
							<Stack direction="row" gap="sm" align="center" wrap="wrap">
								{ cardTitle }
								{ titleAside }
							</Stack>
						) : (
							cardTitle
						) }
						{ description && (
							<Text variant="body-sm" className="jp-protect-card__muted">
								{ description }
							</Text>
						) }
					</Stack>
				</Stack>
				<Stack className="jp-protect-card__header-end" direction="row" gap="sm" align="center">
					{ status && <Badge intent={ status.intent }>{ status.label }</Badge> }
					{ actions }
				</Stack>
			</Card.Header>
			<Card.Content>{ children }</Card.Content>
		</Card.Root>
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
	return (
		<Card.FullBleed className={ `jp-protect-card__row ${ className }`.trim() }>
			{ children }
		</Card.FullBleed>
	);
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

/**
 * A card for a feature this site can't use.
 *
 * @param props       - Component props.
 * @param props.icon  - The feature's icon.
 * @param props.title - The feature's name.
 * @return The card.
 */
export function UnavailableCard( { icon, title }: { icon: ReactElement; title: string } ) {
	return (
		<ProtectCard
			icon={ icon }
			title={ title }
			status={ { label: __( 'Unavailable', 'jetpack-protect-pkg' ), intent: 'none' } }
		>
			<CardRow>
				<Text variant="body-md">
					{ __( 'This feature isn’t available on your site.', 'jetpack-protect-pkg' ) }
				</Text>
			</CardRow>
		</ProtectCard>
	);
}

/**
 * A row showing why the last save of one of the card's settings failed, until dismissed.
 *
 * @param props          - Component props.
 * @param props.settings - Jetpack settings, with their error.
 * @param props.keys     - The settings this card saves.
 * @return The row, or nothing without an error from one of `keys`.
 */
export function SettingsErrorRow( {
	settings,
	keys,
}: {
	settings: ProtectSettingsData;
	keys: string[];
} ) {
	if ( ! settings.error || ! settings.errorKeys.some( key => keys.includes( key ) ) ) {
		return null;
	}
	return (
		<CardRow>
			<Notice.Root intent="error">
				<Notice.Description>{ settings.error }</Notice.Description>
				<Notice.CloseIconButton onClick={ settings.dismissError } />
			</Notice.Root>
		</CardRow>
	);
}
