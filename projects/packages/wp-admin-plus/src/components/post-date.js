/**
 * WordPress dependencies
 */
import { Button, Dropdown, DateTimePicker } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';

export default function PostDateEdit( { id, postIds, type, fallbackText } ) {
	const [ localPostDate, setLocalPostDate ] = useState();
	const posts = useSelect(
		select => {
			return select( coreStore ).getEntityRecords( 'postType', type, {
				include: postIds,
				status: 'any',
			} );
		},
		[ postIds ]
	);

	const { saveEntityRecord } = useDispatch( coreStore );

	async function handleUpdatePost( date ) {
		// 100% optimistic.
		setLocalPostDate( date );

		// Now, save the post
		const savedPost = await saveEntityRecord( 'postType', type, {
			id,
			date,
		} );

		if ( ! savedPost ) {
			// @TODO: improve error handling.
			// eslint-disable-next-line no-console
			return console.error( 'Error saving post: ', savedPost );
		}
	}

	if ( ! posts?.length ) {
		return fallbackText;
	}

	const post = posts.filter( item => item?.id === id );
	if ( ! post?.length ) {
		return fallbackText;
	}

	const singlePost = post[ 0 ];
	const postDate = localPostDate || singlePost.date_gmt;

	return (
		<Dropdown
			position="bottom left"
			contentClassName="edit-post-post-schedule__dialog"
			renderToggle={ ( { onToggle, isOpen } ) => (
				<>
					<Button
						className="post-row__date-button"
						onClick={ onToggle }
						aria-expanded={ isOpen }
						variant="tertiary"
					>
						{ dateI18n( 'Y/m/d \\a\\t g:i a', postDate ) }
					</Button>
				</>
			) }
			renderContent={ () => (
				<DateTimePicker
					currentDate={ postDate }
					onChange={ handleUpdatePost }
					is12Hour={ true }
					events={ [] }
				/>
			) }
		/>
	);
}
