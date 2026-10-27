import { Icon, published } from '@wordpress/icons';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import type { ReactNode } from 'react';

type Props = {
	title: string;
	/** Shown under the title while the panel is closed. */
	summary?: ReactNode;
	complete?: boolean;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
	children: ReactNode;
};

/** A collapsible step of the flow editor that summarizes itself when closed. */
export function FlowPanel( { title, summary, complete, open, onOpenChange, children }: Props ) {
	return (
		<CollapsibleCard.Root
			open={ open }
			onOpenChange={ onOpenChange }
			className="jetpack-flow-panel"
		>
			<CollapsibleCard.Header>
				<Stack align="center" gap="sm">
					{ complete && <Icon icon={ published } className="jetpack-flow-panel__done" /> }
					<Card.Title>{ title }</Card.Title>
					{ ! open && summary && (
						<Text variant="body-md" className="jetpack-flow-panel__summary">
							{ summary }
						</Text>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>{ children }</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
