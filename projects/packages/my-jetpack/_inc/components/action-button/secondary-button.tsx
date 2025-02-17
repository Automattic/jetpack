import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import type { FC, ReactNode, MouseEvent } from 'react';

export type SecondaryButtonProps = {
	href?: string;
	size?: 'normal' | 'small';
	variant?: 'primary' | 'secondary' | 'link' | 'tertiary';
	weight?: 'bold' | 'regular';
	label?: string;
	shouldShowButton?: () => boolean;
	onClick?: ( () => void ) | ( ( { e }: { e: MouseEvent< HTMLButtonElement > } ) => void );
	isExternalLink?: boolean;
	icon?: ReactNode;
	iconSize?: number;
	disabled?: boolean;
	isLoading?: boolean;
	className?: string;
	'aria-labelledby'?: string;
};

// SecondaryButton component
const SecondaryButton: FC< SecondaryButtonProps > = props => {
	const { shouldShowButton = () => true, ...buttonProps } = {
		size: 'small',
		variant: 'secondary',
		weight: 'regular',
		label: __( 'Learn more', 'jetpack-my-jetpack' ),
		...props,
	};

	if ( ! shouldShowButton() ) {
		return false;
	}

	return <Button { ...buttonProps }>{ buttonProps.label }</Button>;
};

export default SecondaryButton;
