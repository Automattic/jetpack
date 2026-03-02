/**
 * External dependencies
 */
import './copy-code-row.scss';
import { Button, Popover, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copySmall, check } from '@wordpress/icons';

type CopyCodeRowProps = {
	text: string;
	tooltipLabel: string;
};

/**
 * A row displaying a code snippet with a copy button.
 *
 * @param {CopyCodeRowProps} props - The component props.
 * @return {JSX.Element} The copy code row component.
 */
export const CopyCodeRow = ( { text, tooltipLabel }: CopyCodeRowProps ) => {
	const [ showCopyConfirmation, setShowCopyConfirmation ] = useState( false );
	const timeoutIdRef = useRef< number | null >( null );

	const ref = useCopyToClipboard( text, () => {
		setShowCopyConfirmation( true );
		if ( timeoutIdRef.current ) {
			clearTimeout( timeoutIdRef.current );
		}
		timeoutIdRef.current = setTimeout( () => {
			setShowCopyConfirmation( false );
		}, 2000 );
	} );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	return (
		<div className="jetpack-form-embed-code__container">
			<span className="jetpack-form-embed-code__text">{ text }</span>
			{ showCopyConfirmation ? (
				<Button
					ref={ ref }
					icon={ check }
					size="compact"
					label={ __( 'Copied!', 'jetpack-forms' ) }
				>
					<Popover
						placement="top"
						noArrow={ false }
						focusOnMount={ false }
						className="jetpack-form-embed-code__popover"
					>
						{ __( 'Copied!', 'jetpack-forms' ) }
					</Popover>
				</Button>
			) : (
				<Tooltip text={ tooltipLabel }>
					<Button ref={ ref } icon={ copySmall } size="compact" label={ tooltipLabel } />
				</Tooltip>
			) }
		</div>
	);
};
