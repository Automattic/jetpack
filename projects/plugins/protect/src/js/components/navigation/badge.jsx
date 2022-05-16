/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import { Text } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import PropTypes from 'prop-types';
import { Icon, check, info } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

/**
 * Gets the Badge element
 *
 * @param {number} count - The number of vulnerabilities found for this item.
 * @param {boolean} notChecked - Whether this item was not checked for vulnerabilities yet.
 * @returns {object} The badge element
 */
const getBadgeElement = ( count, notChecked ) => {
	if ( notChecked ) {
		return {
			popoverText: __(
				'This item was added to your site after the most recent scan. We will check for vulnerabilities during the next scheduled one.',
				'jetpack-protect'
			),
			badgeElement: (
				<Icon icon={ info } size={ 28 } className={ styles[ 'navigation-item-info-badge' ] } />
			),
		};
	}

	if ( count === 0 ) {
		return {
			popoverText: __( 'No known vulnerabilities found to affect this version', 'jetpack-protect' ),
			badgeElement: (
				<Icon icon={ check } size={ 28 } className={ styles[ 'navigation-item-check-badge' ] } />
			),
		};
	}

	return {
		popoverText: null,
		badgeElement: (
			<Text
				variant="body-extra-small"
				className={ styles[ 'navigation-item-badge' ] }
				component="div"
			>
				{ count }
			</Text>
		),
	};
};

const ItemBadge = ( { count, notChecked } ) => {
	const { popoverText, badgeElement } = getBadgeElement( count, notChecked );
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
				<Popover noArrow={ false }>
					<Text variant="body-small" className={ styles[ 'popover-text' ] }>
						{ popoverText }
					</Text>
				</Popover>
			) }
		</div>
	);
};

ItemBadge.propTypes = {
	/* The number of vulnerabilities found for this item */
	count: PropTypes.number,
	/* Whether this item was not checked for vulnerabilities yet */
	notChecked: PropTypes.bool,
};

export default ItemBadge;
