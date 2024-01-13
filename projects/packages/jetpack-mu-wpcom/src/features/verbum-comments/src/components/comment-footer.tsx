import { translate } from '../i18n';
import { classNames } from '../utils';
import { SettingsButton } from './settings-button';
import { isReplyDisabled, isSavingComment, isTrayOpen, userLoggedIn } from '../state';

interface CommentFooterProps {
	toggleTray: ( event: MouseEvent ) => void;
	handleOnSubmitClick: ( event: MouseEvent ) => void;
}

export const CommentFooter = ( { toggleTray, handleOnSubmitClick }: CommentFooterProps ) => {
	return (
		<div
			className={ classNames( 'verbum-footer', {
				'logged-in': userLoggedIn.value,
			} ) }
		>
			{ userLoggedIn.value && (
				<div className="verbum-footer__user">
					<SettingsButton expanded={ isTrayOpen.value } toggleSubscriptionTray={ toggleTray } />
				</div>
			) }
			<div className="verbum-footer__submit">
				<button
					name="submit"
					type="submit"
					id="comment-submit"
					className={ classNames( {
						'is-busy': isSavingComment.value,
					} ) }
					disabled={ isReplyDisabled.value }
					aria-disabled={ isReplyDisabled.value }
					onClick={ handleOnSubmitClick }
				>
					{ translate( 'Reply' ) }
				</button>
			</div>
		</div>
	);
};
