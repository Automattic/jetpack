import { Button } from '@wordpress/components';
import type { ComponentProps, ForwardedRef, MouseEventHandler, ReactNode } from 'react';

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
	href?: string;
	target?: string;
	onClick?: MouseEventHandler< HTMLButtonElement > | MouseEventHandler< HTMLAnchorElement >;
};

// Extract base props from WordPress Button, omitting the union-discriminated properties
// that cause type conflicts (size, variant, disabled, href)
type WPButtonBaseProps = Omit<
	ComponentProps< typeof Button >,
	'size' | 'variant' | 'disabled' | 'href' | 'target' | 'onClick'
>;

export type ButtonProps = JetpackButtonBaseProps & WPButtonBaseProps;
