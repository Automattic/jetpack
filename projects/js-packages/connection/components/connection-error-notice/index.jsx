import { Button } from '@automattic/jetpack-components';
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

export default ConnectErrorNotice;
