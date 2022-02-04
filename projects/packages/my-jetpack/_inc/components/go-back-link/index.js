/**
 * External dependencies
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, arrowLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

/**
 * Simple component that renders a go back link
 *
 * @returns {object} GoBackLink component.
 */
export default function GoBackLink() {
	return (
		<Link to="/" className={ styles.link }>
			<Icon icon={ arrowLeft } className={ styles.icon } />
			{ __( 'Go back', 'jetpack-my-jetpack' ) }
		</Link>
	);
}
