import { Text } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react';
import styles from './styles.module.scss';

const ItemBadge = ( { badgeElement, popoverText } ) => {
	const [ showPopover, setShowPopover ] = useState( false );

	const handleEnter = useCallback( () => {
		setShowPopover( true );
	}, [] );

	const handleOut = useCallback( () => {
		setShowPopover( false );
	}, [] );

	return (
		<div
			onMouseLeave={ popoverText ? handleOut : null }
			onMouseEnter={ popoverText ? handleEnter : null }
			onClick={ popoverText ? handleEnter : null }
			onFocus={ popoverText ? handleEnter : null }
			onBlur={ popoverText ? handleOut : null }
			role="presentation"
		>
			{ badgeElement }
			{ showPopover && (
				<Popover noArrow={ false } inline={ true }>
					<Text variant="body-small" className={ styles[ 'popover-text' ] }>
						{ popoverText }
					</Text>
				</Popover>
			) }
		</div>
	);
};

ItemBadge.propTypes = {
	/** Badge element to display */
	badgeElement: PropTypes.node,
	/** Popover text to display */
	popoverText: PropTypes.string,
};

export default ItemBadge;
