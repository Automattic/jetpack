import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.module.scss';

/**
 * The RNA Connection Error Notice component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectionErrorNotice` component.
 */
const ConnectionErrorNotice = props => {
	const { message } = props;

	return (
		<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
			<Icon icon={ warning } />
			<div className={ styles.message }>{ message }</div>
			<a className={ styles.link }>{ __( 'Restore Connection', 'jetpack' ) }</a>
		</Notice>
	);
};

ConnectionErrorNotice.propTypes = {
	/** The notice message. */
	message: PropTypes.string.isRequired,
};

export default ConnectionErrorNotice;
