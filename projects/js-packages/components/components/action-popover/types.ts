/**
 * Types
 */
import type { Popover } from '@wordpress/components';
import type { ComponentProps, ReactNode } from 'react';

export type ActionPopoverProps = ComponentProps< typeof Popover > & {
	anchor?: Element;
	offset?: number;
} & {
	hideCloseButton?: boolean;
	title: string;
	children: ReactNode;
	step?: number;
	totalSteps?: number;
	buttonContent?: ReactNode;
	buttonDisabled?: boolean;
	buttonHref?: string;
	buttonExternalLink?: boolean;
	onClick?(): void;
};
