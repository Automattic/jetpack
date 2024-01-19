import { translate } from '../i18n';
import { ToggleControl } from './ToggleControl';

interface NewPostsNotificationsProps {
	isChecked: boolean;
	handleOnChange: ( event: boolean ) => void;
	disabled?: boolean;
}

export const NewPostsNotifications = ( {
	isChecked,
	handleOnChange,
	disabled = false,
}: NewPostsNotificationsProps ) => {
	const label = (
		<div className="verbum-toggle-control__label">
			<p className="primary">{ translate( 'Notify me of new posts' ) }</p>
			<p className="secondary">
				{ translate( 'Receive web and mobile notifications for posts on this site.' ) }
			</p>
		</div>
	);

	return (
		<div>
			<ToggleControl
				disabled={ disabled }
				id="new-posts-notifications"
				checked={ isChecked }
				label={ label }
				onChange={ ( e: boolean ) => {
					handleOnChange( e );
				} }
			/>
		</div>
	);
};
