import { Text } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './style.module.scss';
import { ReviewRequestBaseProps } from './types';
import type React from 'react';

const ReviewRequest: React.FC< ReviewRequestBaseProps > = ( { description, cta, onClick } ) => {
	const [ dismissedReview, setDismissedReview ] = useState( true );

	// Fetch the dismiss status from Jetpack Options
	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/site/dismissed-review-request' } ).then(
			res => {
				setDismissedReview( res );
			},
			() => {
				setDismissedReview( true );
			}
		);
	}, [] );

	const dismissMessage = () => {
		apiFetch( {
			path: '/jetpack/v4/site/dismissed-review-request',
			method: 'POST',
			data: { dismissed_value: true },
		} ).then( setDismissedReview( true ) );
	};

	if ( dismissedReview ) {
		return <></>;
	}
	return (
		<>
			<button
				className={ `${ styles.rr } ${ styles.emojisPseudo }` }
				onClick={ onClick }
				role="link"
			>
				<div>
					<Text>{ description }</Text>
					<Text className={ styles.cta }>{ cta }</Text>
				</div>
			</button>
			{ /* eslint-disable-next-line react/jsx-no-bind */ }
			<a role="button" href="#" onClick={ dismissMessage } className={ styles.dismiss }>
				{ __( 'Maybe later', 'jetpack-backup-pkg' ) }
			</a>
		</>
	);
};

export default ReviewRequest;
