/**
 * Types
 */
import type { Popover } from '@wordpress/components';
import type { ComponentProps } from 'react';

export type PublishFirstVideoPopoverProps = {
	id: number | string;
	position?: ComponentProps< typeof Popover >[ 'position' ];
	anchor?: Element;
};
