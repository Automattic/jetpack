import { Text } from '@automattic/jetpack-components';
import { Icon, Popover } from '@wordpress/components';
import React, { useCallback, useState } from 'react';
import styles from './styles.module.scss';

const IconTooltip = ( { icon, iconClassName, iconSize, popoverPosition = 'top', text } ) => {
	const [ showPopover, setShowPopover ] = useState( false );

	const handleEnter = useCallback( () => {
		setShowPopover( true );
	}, [] );

	const handleOut = useCallback( () => {
		setShowPopover( false );
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
