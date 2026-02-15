import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { IconType } from '@wordpress/components';
import type { FC, MouseEvent } from 'react';

export type SecondaryButtonProps = {
	href?: string;
	size?: 'default' | 'compact' | 'small';
	variant?: 'primary' | 'secondary' | 'link' | 'tertiary';
	label?: string;
	shouldShowButton?: () => boolean;
	onClick?: ( () => void ) | ( ( e: MouseEvent< HTMLButtonElement > ) => void );
	icon?: IconType;
	iconSize?: number;
	disabled?: boolean;
	className?: string;
	'aria-labelledby'?: string;
};

// SecondaryButton component
const SecondaryButton: FC< SecondaryButtonProps > = props => {
	const { shouldShowButton = () => true, ...buttonProps } = {
		size: 'small' as const,
		variant: 'secondary' as const,
		label: __( 'Learn more', 'jetpack-my-jetpack' ),
		...props,
	};

	if ( ! shouldShowButton() ) {
		return false;
	}

	return <Button { ...buttonProps }>{ buttonProps.label }</Button>;
};

export default SecondaryButton;
