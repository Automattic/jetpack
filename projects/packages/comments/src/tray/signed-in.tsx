import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { logOut } from '../identity/checkpoint';
import { CommentSignals } from '../shared/state';
import { CloseIcon } from '../ui/icons';
import { SubscriptionOptions, hasSubscriptionOptions } from './subscriptions';

export const SignedIn = () => {
	const { formSettings, signedIn, activeService, subscriptions, isTrayOpen } =
		useContext( CommentSignals );
	const { user, strings, identity } = JetpackComments;
	const current = signedIn.value;
	const hasOptions = hasSubscriptionOptions();

	const leave = async () => {
		// Even on a fresh code with no passport: the next popup must be told to ask the provider again.
		await logOut();

		signedIn.value = null;
		activeService.value = '';
		subscriptions.value = undefined;
	};

	return (
		<div
			className={ clsx( 'jetpack-comments__identity jetpack-comments__identity--signed-in', {
				'is-bare': ! hasOptions,
			} ) }
		>
			<div className="jetpack-comments__signed-in">
				<div className="jetpack-comments__signed-in-heading">
					<div>
						{ user && (
							<>
								<span className="jetpack-comments__signed-in-name">{ user.commentingAs }</span>{ ' ' }
								<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
									{ strings.logOut }
								</a>
							</>
						) }
						{ ! user && current && (
							<>
								<span className="jetpack-comments__signed-in-name">
									{ `${ current.name } - ${ strings.loggedInVia[ current.provider ] } -` }
								</span>{ ' ' }
								<button type="button" className="jetpack-comments__logout" onClick={ leave }>
									{ strings.logOut }
								</button>
							</>
						) }
					</div>
					<button
						type="button"
						className="jetpack-comments__tray-close"
						disabled={ ! isTrayOpen.value }
						onClick={ () => ( isTrayOpen.value = false ) }
					>
						<span className="jetpack-comments__visually-hidden">{ strings.close }</span>
						<CloseIcon />
					</button>
				</div>
				{ hasOptions && <SubscriptionOptions /> }
			</div>
			{ ! user && current && current.code !== null && (
				<input type="hidden" name={ identity.codeField } value={ current.code } />
			) }
			{ ! user && current && current.code === null && (
				<input type="hidden" name={ identity.passportField } value="1" />
			) }
		</div>
	);
};
