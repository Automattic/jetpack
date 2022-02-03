/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from '../common/constants';

const typeClassMap = {
	[ ONE_TIME_DONATION ]: 'donations__one-time-item',
	[ MONTHLY_DONATION ]: 'donations__monthly-item',
	[ ANNUAL_DONATION ]: 'donations__annual-item',
};

export default function Save( { attributes } ) {
	const { type } = attributes;

	return (
		<div className={ typeClassMap[ type ] }>
			<InnerBlocks.Content />
		</div>
	);
}
