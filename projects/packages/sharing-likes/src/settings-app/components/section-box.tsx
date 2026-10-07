import { Icon } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import type { JSX, ReactElement, ReactNode } from 'react';

/**
 * One section of the screen: an icon, a title, an optional status, a one-line description, then divided rows.
 *
 * @param props             - Props.
 * @param props.id          - Anchor other screens link to.
 * @param props.icon        - Header icon.
 * @param props.title       - Heading.
 * @param props.badge       - Short status next to the title, e.g. "On".
 * @param props.description - What the section is for.
 * @param props.children    - Rows.
 * @return Section.
 */
export function SectionBox( {
	id,
	icon,
	title,
	badge,
	description,
	children,
}: {
	id?: string;
	icon: ReactElement;
	title: string;
	badge?: string;
	description?: ReactNode;
	children: ReactNode;
} ): JSX.Element {
	return (
		<section id={ id } className="jetpack-sharing-likes__box">
			<Stack
				render={ <header /> }
				direction="row"
				align="center"
				gap="md"
				className="jetpack-sharing-likes__box-header"
			>
				<Icon icon={ icon } className="jetpack-sharing-likes__box-icon" />
				<Text variant="heading-lg" render={ <h2 /> } className="jetpack-sharing-likes__box-title">
					{ title }
				</Text>
				{ badge && <Text className="jetpack-sharing-likes__box-badge">{ badge }</Text> }
			</Stack>
			{ description && (
				<Text render={ <p /> } className="jetpack-sharing-likes__box-description">
					{ description }
				</Text>
			) }
			{ children }
		</section>
	);
}

/**
 * A divided row inside a section.
 *
 * @param props          - Props.
 * @param props.children - Row content.
 * @return Row.
 */
export function BoxRow( { children }: { children: ReactNode } ): JSX.Element {
	return (
		<Stack direction="column" gap="md" className="jetpack-sharing-likes__box-row">
			{ children }
		</Stack>
	);
}
