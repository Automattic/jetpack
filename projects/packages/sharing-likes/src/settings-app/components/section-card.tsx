import { Card, Stack, Text } from '@wordpress/ui';
import type { JSX, ReactNode } from 'react';

/**
 * One section of the screen, as Newsletter's settings cards: a title, an optional description, then its settings.
 *
 * @param props             - Props.
 * @param props.id          - Anchor other screens link to.
 * @param props.title       - Heading.
 * @param props.description - What the section is for.
 * @param props.children    - Settings.
 * @return Card.
 */
export function SectionCard( {
	id,
	title,
	description,
	children,
}: {
	id?: string;
	title: string;
	description?: ReactNode;
	children: ReactNode;
} ): JSX.Element {
	return (
		<Card.Root id={ id }>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ description && <Text render={ <p /> }>{ description }</Text> }
					{ children }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Settings that belong together inside a section, such as a notice and its button.
 *
 * @param props          - Props.
 * @param props.children - Content.
 * @return Group.
 */
export function SettingGroup( { children }: { children: ReactNode } ): JSX.Element {
	return (
		<Stack direction="column" gap="md">
			{ children }
		</Stack>
	);
}
