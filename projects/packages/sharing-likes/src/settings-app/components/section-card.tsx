import { Card, Stack } from '@wordpress/ui';
import type { JSX, ReactNode } from 'react';

/**
 * One section of the screen.
 *
 * @param props          - Props.
 * @param props.id       - Anchor other screens link to.
 * @param props.title    - Heading.
 * @param props.children - Content.
 * @return Card.
 */
export function SectionCard( {
	id,
	title,
	children,
}: {
	id?: string;
	title: string;
	children: ReactNode;
} ): JSX.Element {
	return (
		<Card.Root id={ id }>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ children }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
