import { Button } from '@automattic/jetpack-components';
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

	if ( Object.values( connectionErrors ).length ) {
		const errors = Object.values( connectionErrors ).shift();

		if ( errors.length && errors[ 0 ].error_message ) {
			return (
				<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
					<Icon icon={ warning } />
					<div className={ styles.message }>{ errors[ 0 ].error_message }</div>
					<Button variant="link" className={ styles.link } href="#">
						{ __( 'Restore Connection', 'jetpack' ) }
					</Button>
				</Notice>
			);
		}
	}
	return null;
};

ConnectionErrorNotice.propTypes = {
	/** The notice message. */
	message: PropTypes.string.isRequired,
};

export default ConnectionErrorNotice;
