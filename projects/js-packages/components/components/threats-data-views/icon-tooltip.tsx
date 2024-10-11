import { Text } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import React, { useCallback, useState } from 'react';
import styles from './styles.module.scss';

const IconTooltip = ( { icon, iconClassName, iconSize, popoverPosition = 'top', text } ) => {
	const [ showPopover, setShowPopover ] = useState( false );
	const [ timeoutId, setTimeoutId ] = useState( null );

	const handleEnter = useCallback( () => {
		// Clear any existing timeout if user hovers back quickly
		if ( timeoutId ) {
			clearTimeout( timeoutId );
			setTimeoutId( null );
		}
		setShowPopover( true );
	}, [ timeoutId ] );

	const handleOut = useCallback( () => {
		// Set a timeout to delay the hiding of the popover
		const id = setTimeout( () => {
			setShowPopover( false );
			setTimeoutId( null ); // Clear the timeout ID after the popover is hidden
		}, 100 );

		setTimeoutId( id );
	}, [] );

	return (
		<div
			className={ styles[ 'icon-popover' ] }
			onMouseLeave={ handleOut }
			onMouseEnter={ handleEnter }
			onClick={ handleEnter }
			onFocus={ handleEnter }
			onBlur={ handleOut }
			role="presentation"
		>
			<Icon className={ iconClassName } icon={ icon } size={ iconSize } />
			{ showPopover && (
				<Popover noArrow={ false } offset={ 5 } inline={ true } position={ popoverPosition }>
					<Text className={ styles[ 'popover-text' ] } variant={ 'body-small' }>
						{ text }
					</Text>
				</Popover>
			) }
		</div>
	);
};

export default IconTooltip;
