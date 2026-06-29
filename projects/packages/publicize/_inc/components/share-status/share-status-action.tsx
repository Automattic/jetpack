import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
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
			<Link openInNewTab href={ shareItem.message } onClick={ recordViewEvent }>
				{ __( 'View', 'jetpack-publicize-pkg' ) }
			</Link>
		);
	}

	return <Retry shareItem={ shareItem } />;
}
