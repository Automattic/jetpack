import { Icon, close } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.scss';

const CloseLink = ( { className, accessibleName } ) => {
	return (
		<Link
			to="/"
			className={ classNames( styles.link, className ) }
			aria-label={ accessibleName || null }
		>
			<Icon icon={ close } className={ styles.icon } />
		</Link>
	);
};

export default CloseLink;
