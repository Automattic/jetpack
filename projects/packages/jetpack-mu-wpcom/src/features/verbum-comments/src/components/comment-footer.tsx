import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { translate } from '../i18n';
import { VerbumSignals } from '../state';
import { SettingsButton } from './settings-button';

interface CommentFooterProps {
	toggleTray: ( event: MouseEvent ) => void;
}

export const CommentFooter = ( { toggleTray }: CommentFooterProps ) => {
	const { commentParent, isReplyDisabled, isSavingComment, isTrayOpen, userLoggedIn } =
		useContext( VerbumSignals );
	return (
		<div
			className={ clsx( 'verbum-footer', {
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
					className={ clsx( {
						'is-busy': isSavingComment.value,
					} ) }
					disabled={ isReplyDisabled.value }
					aria-disabled={ isReplyDisabled.value }
				>
					{ commentParent.value ? translate( 'Reply' ) : translate( 'Comment' ) }
				</button>
			</div>
		</div>
	);
};
