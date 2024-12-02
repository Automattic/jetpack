import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { Retry, RetryProps } from './retry';

type ShareStatusActionProps = RetryProps;

/**
 *
 * Share status action component.
 *
 * @param {ShareStatusActionProps} props - component props
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatusAction( { shareItem }: ShareStatusActionProps ) {
	const { recordEvent } = useAnalytics();

	const recordViewEvent = useCallback( () => {
		recordEvent( 'jetpack_social_share_status_view', {
			service: shareItem.service,
			location: 'modal',
		} );
	}, [ recordEvent, shareItem.service ] );

	if ( 'success' === shareItem.status ) {
		return (
			<ExternalLink href={ shareItem.message } onClick={ recordViewEvent }>
				{ __( 'View', 'jetpack-publicize-components' ) }
			</ExternalLink>
		);
	}

	return <Retry shareItem={ shareItem } />;
}
