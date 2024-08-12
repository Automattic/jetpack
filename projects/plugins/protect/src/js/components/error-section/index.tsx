import { H3, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import inProgressImage from '../../../../assets/images/in-progress.png';
import AlertSVGIcon from '../alert-icon';
import SeventyFiveLayout from '../seventy-five-layout';
import styles from './styles.module.scss';

type ErrorScreenProps = {
	baseErrorMessage: string;
	errorMessage: string;
	errorCode: string;
};

/**
 * Protect Logo component
 *
 * @param {object} props                  - Component props
 * @param {string} props.baseErrorMessage - Base error message.
 * @param {string} props.errorMessage     - Error message.
 * @param {string} props.errorCode        - Error code.
 * @returns {React.ReactElement}   Component template
 */
export default function ErrorScreen( {
	baseErrorMessage = '',
	errorMessage = '',
	errorCode = '',
}: ErrorScreenProps ): React.ReactElement {
	let displayErrorMessage = errorMessage ? `${ errorMessage } (${ errorCode }).` : baseErrorMessage;
	displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

	return (
		<SeventyFiveLayout
			main={
				<div className={ styles[ 'main-content' ] }>
					<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } color="#D63638" />
					<H3>{ baseErrorMessage }</H3>
					<Text>{ displayErrorMessage }</Text>
				</div>
			}
			secondary={
				<div className={ styles.illustration }>
					<img src={ inProgressImage } alt="" />
				</div>
			}
			preserveSecondaryOnMobile={ false }
		/>
	);
}
