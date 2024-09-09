import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
	if ( 'success' === shareItem.status ) {
		return <ExternalLink href={ shareItem.message }>{ __( 'View', 'jetpack' ) }</ExternalLink>;
	}

	return <Retry shareItem={ shareItem } />;
}
