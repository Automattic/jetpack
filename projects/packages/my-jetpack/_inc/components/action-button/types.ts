import type { Button, IconType } from '@wordpress/components';
import type { ComponentProps } from 'react';

type ProductButtonProps = Pick<
	ComponentProps< typeof Button >,
	'size' | 'variant' | 'disabled' | 'className'
>;

export type AdditionalAction = ProductButtonProps & {
	label: string;
	href?: string;
	onClick?: () => void;
};

export type SecondaryAction = ProductButtonProps & {
	href: string;
	label: string;
	shouldShowButton?: () => boolean;
	onClick: () => void;
	positionFirst?: boolean;
	icon?: IconType;
	iconSize?: number;
	disabled?: boolean;
	className?: string;
};
