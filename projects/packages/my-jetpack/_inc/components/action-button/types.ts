import type { IconType } from '@wordpress/components';

type ProductButtonProps = {
	size?: 'normal' | 'small';
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
	weight?: 'bold' | 'regular';
	disabled?: boolean;
	className?: string;
};

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
	icon?: IconType;
	iconSize?: number;
	disabled?: boolean;
	isLoading?: boolean;
	className?: string;
};
