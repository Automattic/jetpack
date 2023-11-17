import { Button } from '@wordpress/components';
import type React from 'react';

type JetpackButtonBaseProps = {
	className?: string;
	children?: React.ReactNode;
	disabled?: boolean;
	isDestructive?: boolean;
	isLoading?: boolean;
	isExternalLink?: boolean;
	size?: 'normal' | 'small';
	text?: string;
	variant?: 'primary' | 'secondary' | 'link' | 'tertiary';
	weight?: 'bold' | 'regular';
	fullWidth?: boolean;
	ref?: React.ForwardedRef< unknown >;
};

type WPButtonProps = Omit< React.ComponentProps< typeof Button >, 'size' | 'variant' >;

export type ButtonProps = JetpackButtonBaseProps & WPButtonProps;
