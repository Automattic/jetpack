import type { ButtonProps } from '@automattic/jetpack-components';
import type { ReactNode } from 'react';

type ProductButtonProps = Pick<
	ButtonProps,
	'size' | 'variant' | 'weight' | 'disabled' | 'className'
>;

export type AdditionalAction = ProductButtonProps & {
	label: string;
	href?: string;
	onClick?: () => void;
	isExternalLink?: boolean;
};

export type SecondaryAction = ProductButtonProps & {
	href: string;
	label: string;
	shouldShowButton?: () => boolean;
	onClick: () => void;
	positionFirst?: boolean;
	isExternalLink?: boolean;
	icon?: ReactNode;
	iconSize?: number;
	disabled?: boolean;
	isLoading?: boolean;
	className?: string;
};
