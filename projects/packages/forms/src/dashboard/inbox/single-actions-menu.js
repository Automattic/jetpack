/**
 * External dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { trash, inbox, moreHorizontal } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { doBulkAction } from '../data/responses';
import { STORE_NAME } from '../state';
import { ACTION_TABS, ACTIONS, RESPONSES_FETCH_LIMIT, TABS } from './constants';
import { useFeedbackQuery } from './use-feedback-query';

const SingleActionsMenu = ( { id } ) => {
	const { addTabTotals, fetchResponses, removeResponses, setLoading } = useDispatch( STORE_NAME );
	const { currentPage, query } = useFeedbackQuery();

	const currentTab = query.status;

	const deleteLabel =
		currentTab !== TABS.trash
			? _x( 'Trash', 'verb', 'jetpack-forms' )
			: __( 'Delete permanently', 'jetpack-forms' );
	const deleteAction = currentTab !== TABS.trash ? ACTIONS.moveToTrash : ACTIONS.delete;

	const onActionHandler = action => async () => {
		try {
			setLoading( true );
			removeResponses( [ id ] );
			addTabTotals( {
				[ currentTab ]: -1,
				[ ACTION_TABS[ action ] ]: 1,
			} );
			await doBulkAction( [ id ], action );

			await fetchResponses(
				{
					...query,
					limit: RESPONSES_FETCH_LIMIT,
					offset: ( currentPage - 1 ) * RESPONSES_FETCH_LIMIT,
				},
				{ append: true }
			);
			setLoading( false );
		} catch ( error ) {
			setLoading( false );
		}
	};

	return (
		<DropdownMenu
			icon={ moreHorizontal }
			popoverProps={ {
				position: 'bottom left',
			} }
		>
			{ () => (
				<MenuGroup>
					{ currentTab === TABS.spam && (
						<MenuItem
							onClick={ onActionHandler( ACTIONS.markAsNotSpam ) }
							iconPosition="left"
							icon={ inbox }
						>
							{ __( 'Not spam', 'jetpack-forms' ) }
						</MenuItem>
					) }

					{ currentTab === TABS.inbox && (
						<MenuItem
							onClick={ onActionHandler( ACTIONS.markAsSpam ) }
							iconPosition="left"
							icon={
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M11 13V7H13V13H11Z" />
									<path d="M11 15V17H13V15H11Z" />
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M20.75 12C20.75 16.8325 16.8325 20.75 12 20.75C7.16751 20.75 3.25 16.8325 3.25 12C3.25 7.16751 7.16751 3.25 12 3.25C16.8325 3.25 20.75 7.16751 20.75 12ZM12 19.25C16.0041 19.25 19.25 16.0041 19.25 12C19.25 7.99594 16.0041 4.75 12 4.75C7.99594 4.75 4.75 7.99594 4.75 12C4.75 16.0041 7.99594 19.25 12 19.25Z"
									/>
								</svg>
							}
						>
							{ __( 'Mark as spam', 'jetpack-forms' ) }
						</MenuItem>
					) }

					{ currentTab === TABS.trash && (
						<MenuItem
							onClick={ onActionHandler( ACTIONS.removeFromTrash ) }
							iconPosition="left"
							icon={ inbox }
						>
							{ __( 'Remove from trash', 'jetpack-forms' ) }
						</MenuItem>
					) }

					<MenuItem
						onClick={ onActionHandler( deleteAction ) }
						iconPosition="left"
						icon={ trash }
						variant="tertiary"
						isDestructive
					>
						{ deleteLabel }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};

export default SingleActionsMenu;
