import { Button } from '@wordpress/components';
import type { ComponentProps, ForwardedRef, ReactNode } from 'react';

type JetpackButtonBaseProps = {
	className?: string;
	children?: ReactNode;
	disabled?: boolean;
	isDestructive?: boolean;
	isLoading?: boolean;
	isExternalLink?: boolean;
	size?: 'normal' | 'small';
	text?: string;
	variant?: 'primary' | 'secondary' | 'link' | 'tertiary';
	weight?: 'bold' | 'regular';
	fullWidth?: boolean;
	ref?: ForwardedRef< unknown >;
};

type WPButtonProps = Omit< ComponentProps< typeof Button >, 'size' | 'variant' >;

export type ButtonProps = JetpackButtonBaseProps & WPButtonProps;
