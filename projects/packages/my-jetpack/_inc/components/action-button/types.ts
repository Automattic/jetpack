type ProductButtonProps = {
	size?: 'normal' | 'compact';
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
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
	disabled?: boolean;
	isLoading?: boolean;
	className?: string;
};
