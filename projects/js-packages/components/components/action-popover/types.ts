/**
 * Types
 */
import type { Popover } from '@wordpress/components';

export type ActionPopoverProps = Popover.Props & {
	anchor?: Element;
	offset?: number;
} & {
	hideCloseButton?: boolean;
	title: string;
	children: React.ReactNode;
	step?: number;
	totalSteps?: number;
	actionButtonText?: string;
	actionButtonDisabled?: boolean;
	onClick?(): void;
};
