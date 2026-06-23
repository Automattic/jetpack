import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { store as socialStore } from '../../social-store';
import ErrorBoundary from '../error-boundary';
import { ShareStatus } from '../post-publish-share-status/share-status';
import { ShareStatusModalTrigger } from '../share-status';
import styles from './styles.module.scss';

export const ReSharingPanel = () => {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	const [ reShareTimestamp, setReShareTimestamp ] = useState( null );

	useEffect( () => {
		if ( shareStatus.polling ) {
			// Update the timestamp whenever polling becomes true
			setReShareTimestamp( Date.now() / 1000 );
		}
	}, [ shareStatus.polling ] );

	return (
		<ErrorBoundary
			fallback={
				<Notice status="error" isDismissible={ false }>
					{ __( 'Unable to load the sharing status.', 'jetpack-publicize-pkg' ) }
				</Notice>
			}
		>
			{ reShareTimestamp ? (
				<div className={ styles.wrapper }>
					<ShareStatus reShareTimestamp={ reShareTimestamp } />
				</div>
			) : (
				<ShareStatusModalTrigger withWrapper analyticsData={ { location: 'editor' } } />
			) }
		</ErrorBoundary>
	);
};
