/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';

export default function PostDateEdit( { id, status, type, fallbackText } ) {
	let post = useSelect(
		select =>
			select( coreStore ).getEntityRecords( 'postType', type, {
				include: [ id ],
				status,
				per_page: 1,
			} ),
		[]
	);

	if ( ! post?.length ) {
		return fallbackText;
	}

	post = post[ 0 ];
	return <Button onClick={ () => {} }>{ dateI18n( 'Y/m/d \\a\\t g:ia', post.date_gmt ) }</Button>;
}
