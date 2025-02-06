import { Icon, close } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.scss';

const CloseLink = ( { className, accessibleName } ) => {
	return (
		<Link to="/" className={ clsx( styles.link, className ) } aria-label={ accessibleName || null }>
			<Icon icon={ close } className={ styles.icon } />
		</Link>
	);
};

export default CloseLink;
