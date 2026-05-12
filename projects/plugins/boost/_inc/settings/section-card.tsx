import { Card, Stack } from '@wordpress/ui';
import type { ReactNode } from 'react';

type Props = {
	title: ReactNode;
	/** Body slot — typically a stack of `ModuleRow`s, but free-form content like the Cornerstone description is also valid here. */
	children: ReactNode;
};

/**
 * Section primitive used to group related module toggles under one
 * `Card.Root` with a shared header. Mirrors the design's IA where
 * each section ("Code loading optimization", "Image CDN
 * configuration", etc.) is a single card containing multiple module
 * rows, rather than one card per module.
 *
 * @param props          - See `Props`.
 * @param props.title
 * @param props.children
 * @return The section card element.
 */
export default function SectionCard( { title, children }: Props ): JSX.Element {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ children }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
