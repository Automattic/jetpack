/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { PostingActivityAttributes } from './widget';

type PostingActivityWindowControlProps = {
	data: PostingActivityAttributes;
	onChange: ( edits: Partial< PostingActivityAttributes > ) => void;
};

function toWindowOffset( value?: number ) {
	if ( typeof value !== 'number' || ! Number.isFinite( value ) ) {
		return 0;
	}

	return Math.trunc( value );
}

export function PostingActivityWindowControl( {
	data,
	onChange,
}: PostingActivityWindowControlProps ) {
	const windowOffset = toWindowOffset( data.activityWindowOffset );

	return (
		<Stack direction="row" align="center" gap="xs">
			<Button
				type="button"
				variant="minimal"
				tone="neutral"
				size="small"
				onClick={ () => onChange( { activityWindowOffset: windowOffset + 1 } ) }
				aria-label={ __( 'Show older posting activity', 'jetpack-premium-analytics' ) }
			>
				<Button.Icon icon={ chevronLeft } size={ 16 } />
			</Button>

			<Button
				type="button"
				variant="minimal"
				tone="neutral"
				size="small"
				onClick={ () => onChange( { activityWindowOffset: windowOffset - 1 } ) }
				aria-label={ __( 'Show newer posting activity', 'jetpack-premium-analytics' ) }
			>
				<Button.Icon icon={ chevronRight } size={ 16 } />
			</Button>
		</Stack>
	);
}
