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
	variant?: 'primary' | 'secondary' | 'link';
	weight?: 'bold' | 'regular';
	fullWidth?: boolean;
	ref: React.ForwardedRef< unknown >;
};

type JetpackLinkProps = Omit< Button.AnchorProps, 'size' | 'variant' >;

type JetpackButtonProps = Omit< Button.ButtonProps, 'size' | 'variant' >;

export type ButtonProps = JetpackButtonBaseProps & ( JetpackLinkProps | JetpackButtonProps );
