/**
 * WordPress dependencies
 */
import { Button, Dropdown, DateTimePicker } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';
import { useState, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import usePost from '../../hooks/use-post';
import { store as noticesStore } from '@wordpress/notices';

function getDateLabel( status, date ) {
	let dateLabel = '';

	switch ( status ) {
		case 'publish':
			dateLabel = sprintf(
				/* translators: %s: Publish state and date of the post. */
				__( 'Published %s', 'jetpack-post-list' ),
				dateI18n( 'Y/m/d \\a\\t g:i a', date )
			);
			break;

		case 'future':
			dateLabel = sprintf(
				/* translators: %s: Future state and date of the post. */
				__( 'Scheduled %s', 'jetpack-post-list' ),
				dateI18n( 'Y/m/d \\a\\t g:i a', date )
			);
			break;

		case 'draft':
			dateLabel = sprintf(
				/* translators: %s: Draft state and date of the post. */
				__( 'Last Modified %s', 'jetpack-post-list' ),
				dateI18n( 'Y/m/d \\a\\t g:i a', date )
			);
			break;

		default:
			dateLabel = dateI18n( 'Y/m/d \\a\\t g:i a', date );
	}

	return dateLabel;
}

export default function PostDateEdit( { id, postIds, type, fallbackText, status } ) {
	const [ localPostDate, setLocalPostDate ] = useState();
	const [ localPostStatus, setLocalPostStatus ] = useState();
	const post = usePost( { id, postIds, type } );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

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

		// Update the Post Status once the post saves.
		setLocalPostStatus( savedPost?.status );

		createSuccessNotice( getDateLabel( savedPost?.status, savedPost?.date ), {
			type: 'snackbar',
			actions: [
				{
					label: __( 'Undo', 'jetpack-post-list' ),
					onClick: console.warn,
				},
			],
		} );
	}

	if ( ! post ) {
		return fallbackText;
	}

	const postDate = localPostDate || post.date_gmt;
	const postStatus = localPostStatus || post.status || status;

	return (
		<Fragment>
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
							{ getDateLabel( postStatus, postDate ) }
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
		</Fragment>
	);
}
