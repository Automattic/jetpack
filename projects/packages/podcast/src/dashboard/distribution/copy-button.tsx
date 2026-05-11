import { Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon } from '@wordpress/icons';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps< typeof Button >;
type IconProp = ButtonProps[ 'icon' ];

interface CopyButtonProps {
	value: string;
	label?: string;
	copiedLabel?: string;
	icon?: IconProp;
	// When set, swap to this icon for the 2s after-copy window.
	copiedIcon?: IconProp;
	iconPosition?: ButtonProps[ 'iconPosition' ];
	variant?: ButtonProps[ 'variant' ];
	disabled?: boolean;
	className?: string;
	__next40pxDefaultSize?: boolean;
}

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const DEFAULT_LABEL = __( 'Copy link', 'jetpack-podcast' );
const DEFAULT_COPIED_LABEL = __( 'Copied!', 'jetpack-podcast' );

const CopyButton = ( {
	value,
	label = DEFAULT_LABEL,
	copiedLabel = DEFAULT_COPIED_LABEL,
	icon = linkIcon,
	copiedIcon,
	iconPosition,
	variant = 'secondary',
	disabled,
	className,
	__next40pxDefaultSize = true,
}: CopyButtonProps ) => {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyRef = useCopyToClipboard< HTMLButtonElement >( value, () => setHasCopied( true ) );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}
		const timer = setTimeout( () => setHasCopied( false ), 2000 );
		return () => clearTimeout( timer );
	}, [ hasCopied ] );

	return (
		<Button
			ref={ copyRef }
			variant={ variant }
			icon={ hasCopied && copiedIcon ? copiedIcon : icon }
			iconPosition={ iconPosition }
			disabled={ disabled }
			accessibleWhenDisabled
			className={ className }
			__next40pxDefaultSize={ __next40pxDefaultSize }
		>
			{ hasCopied ? copiedLabel : label }
		</Button>
	);
};

export default CopyButton;
