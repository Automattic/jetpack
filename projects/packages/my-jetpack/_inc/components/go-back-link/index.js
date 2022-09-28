import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.scss';

/**
 * Simple component that renders a go back link
 *
 * @param {object} props           - Component props.
 * @param {Function} props.onClick - A callback to execute on click
 * @returns {object}                 GoBackLink component.
 */
function GoBackLink( { onClick } ) {
	return (
		<Link to="/" className={ styles.link } onClick={ onClick }>
			<Icon icon={ arrowLeft } className={ styles.icon } />
			{ __( 'Go back', 'jetpack-my-jetpack' ) }
		</Link>
	);
}

GoBackLink.defaultProps = {
	onClick: () => {},
};

export default GoBackLink;
