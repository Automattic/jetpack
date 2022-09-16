import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import React from 'react';
import useConnection from '../use-connection';
import styles from './styles.module.scss';

/**
 * The RNA Connection Error Notice component.
 *
 * @returns {React.Component} The `ConnectionErrorNotice` component.
 */
const ConnectErrorNotice = () => {
	const { connectionErrors } = useConnection( {} );

	if ( connectionErrors.length ) {
		return (
			<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
				<Icon icon={ warning } />
				<div className={ styles.message }>{ connectionErrors[ 0 ] }</div>
				<a className={ styles.link }>{ __( 'Restore Connection', 'jetpack' ) }</a>
			</Notice>
		);
	}
	return '';
};

export default ConnectErrorNotice;
