import { Icon, chevronRight, external } from '@wordpress/icons';
import { Card, Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import type { MouseEvent, ReactNode } from 'react';

export interface ManageConnectionActionCardProps {
	/** Card title. */
	title: ReactNode;
	/** Click handler for the card link. */
	onClick?: ( e: MouseEvent< HTMLAnchorElement > ) => void;
	/** Whether the link points to an external destination. */
	isExternal?: boolean;
	/** Link target. */
	link?: string;
	/** Action slug appended to the card class. */
	action?: string;
	/** Whether the card is disabled. */
	disabled?: boolean;
}

/**
 * A single action card used within the connection management dialogs. Renders a
 * `@wordpress/ui` Card as an anchor with a trailing chevron/external icon.
 *
 * @param {ManageConnectionActionCardProps} props - Component props.
 * @return {import('react').ReactNode} The ManageConnectionActionCard component.
 */
const ManageConnectionActionCard = ( {
	title,
	onClick = () => null,
	isExternal = false,
	link = '#',
	action,
	disabled = false,
}: ManageConnectionActionCardProps ) => {
	const disabledCallback = useCallback(
		( e: MouseEvent< HTMLAnchorElement > ) => e.preventDefault(),
		[]
	);

	return (
		<Card.Root
			className={ clsx( 'jp-connection__manage-dialog__action-card', action, { disabled } ) }
			render={
				<a
					href={ link }
					onClick={ ! disabled ? onClick : disabledCallback }
					target={ isExternal ? '_blank' : '_self' }
					rel="noopener noreferrer"
					aria-disabled={ disabled || undefined }
				/>
			}
		>
			<Card.Content>
				<Stack direction="row" align="center" justify="space-between" gap="sm">
					{ title }
					<Icon icon={ isExternal ? external : chevronRight } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default ManageConnectionActionCard;
