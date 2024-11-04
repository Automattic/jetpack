import { Text } from '@automattic/jetpack-components';
import { Popover, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, check, info } from '@wordpress/icons';
import PropTypes from 'prop-types';
import React, { useState, useCallback, useMemo } from 'react';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import styles from './styles.module.scss';

/**
 * Gets the Badge element
 *
 * @param {number}  count   - The number of threats found for this item.
 * @param {boolean} checked - Whether this item was checked for threats yet.
 * @return {object} The badge element
 */
const getBadgeElement = ( count, checked ) => {
	if ( ! checked ) {
		return {
			popoverText: __(
				'This item was added to your site after the most recent scan. We will check for threats during the next scheduled one.',
				'jetpack-protect'
			),
			badgeElement: (
				<Icon icon={ info } size={ 28 } className={ styles[ 'navigation-item-info-badge' ] } />
			),
		};
	}

	if ( count === 0 ) {
		return {
			popoverText: __( 'No known threats found to affect this version', 'jetpack-protect' ),
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

const ItemBadge = ( { count, checked } ) => {
	const { data: status } = useScanStatusQuery();

	const { popoverText, badgeElement } = getBadgeElement( count, checked );
	const [ showPopover, setShowPopover ] = useState( false );

	const inProgress = useMemo( () => isScanInProgress( status ), [ status ] );

	const handleEnter = useCallback( () => {
		if ( inProgress ) {
			return;
		}

		setShowPopover( true );
	}, [ inProgress ] );

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
			{ ! inProgress ? badgeElement : <Spinner /> }
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
	/* The number of threats found for this item */
	count: PropTypes.number,
	/* Whether this item was checked for threats yet */
	checked: PropTypes.bool,
};

export default ItemBadge;
