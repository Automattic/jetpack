import { Icon, close } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.scss';

const CloseLink = ( { className, accessibleName } ) => {
	return (
		<Link to="/" className={ classNames( styles.link, className ) }>
			<Icon icon={ close } className={ styles.icon } />
			{ /* Screen reader users require a textual information of what the button does. */ }
			<span className={ styles[ 'visually-hidden' ] }>{ accessibleName }</span>
		</Link>
	);
};

export default CloseLink;
