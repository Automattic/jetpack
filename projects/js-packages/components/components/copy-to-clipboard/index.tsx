import { Button, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';
import type { CopyToClipboardProps } from './types.ts';
import type { ComponentProps, FC } from 'react';

export const CopyToClipboard: FC< CopyToClipboardProps > = ( {
	buttonStyle = 'icon',
	textToCopy,
	onCopy,
	copyMessage,
	copiedMessage,
	children,
	...buttonProps
} ) => {
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >( undefined );

	const copyRef = useCopyToClipboard( textToCopy, () => {
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		setHasCopied( true );
		onCopy?.();
		copyTimer.current = setTimeout( () => {
			setHasCopied( false );
			copyTimer.current = undefined;
		}, 4000 );
	} );

	useEffect( () => {
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );

	const copyLabel = copyMessage ?? __( 'Copy', 'jetpack-components' );
	const copiedLabel = copiedMessage ?? __( 'Copied!', 'jetpack-components' );
	const idleLabel = children ?? copyLabel;
	const tooltipLabel = hasCopied ? copiedLabel : copyLabel;

	const showIcon = buttonStyle !== 'text';
	const showLabel = buttonStyle !== 'icon';

	let icon;
	if ( showIcon ) {
		icon = hasCopied ? check : copySmall;
	}

	let label = null;
	if ( showLabel ) {
		label = hasCopied ? copiedLabel : idleLabel;
	}

	// Cast works around WP Button's discriminated-union type, which can't be
	// satisfied when forwarding pass-through props.
	const wpButtonProps = {
		'aria-label': copyLabel,
		icon,
		ref: copyRef,
		...buttonProps,
		children: label,
	} as ComponentProps< typeof Button >;

	const button = <Button { ...wpButtonProps } />;

	if ( buttonStyle === 'icon' ) {
		return (
			<Tooltip key={ tooltipLabel } delay={ 0 } hideOnClick={ false } text={ tooltipLabel }>
				{ button }
			</Tooltip>
		);
	}

	return button;
};

export default CopyToClipboard;
