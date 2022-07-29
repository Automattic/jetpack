import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './style.module.scss';
import { ReviewRequestBaseProps } from './types';
import type React from 'react';

const ReviewRequest: React.FC< ReviewRequestBaseProps > = ( {
	cta,
	onClick,
	requestReason,
	reviewText,
	dismissedReview,
	dismissMessage,
} ) => {
	if ( dismissedReview || requestReason === '' ) {
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
					<Text>{ reviewText }</Text>
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
