/**
 * External dependencies
 */
import type React from 'react';
import { Button } from '@wordpress/components';

type JetpackButtonBaseProps = {
	className?: string;
	children?: React.ReactNode;
	disabled?: boolean;
	isDestructive?: boolean;
	isLoading?: boolean;
	isExternalLink?: boolean;
	size?: 'normal' | 'small';
	text?: string;
	weight?: 'bold' | 'regular';
};

type JetpackLinkProps = Omit< Button.AnchorProps, 'size' | 'variant' > & {
	variant?: 'link' | 'external-link';
};

type JetpackButtonProps = Omit< Button.ButtonProps, 'size' | 'variant' > & {
	variant?: 'primary' | 'secondary';
};

export type ButtonProps = JetpackButtonBaseProps & ( JetpackLinkProps | JetpackButtonProps );
