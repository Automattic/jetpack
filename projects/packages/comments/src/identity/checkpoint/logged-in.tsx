import { useContext } from 'preact/hooks';
import { CommentSignals } from '../../shared/state';
import { logOut } from './checkpoint';
import { CloseIcon } from './icons';

import './style.scss';

/**
 * Who the popup signed in, and a way out. Lives in the tray, so the close
 * button folds it away. A fresh sign-in posts its code; a returning one posts
 * a marker, so the server uses the passport only when this was on screen.
 *
 * @return The signed-in identity block.
 */
export const LoggedIn = () => {
	const { signedIn, activeService, isTrayOpen } = useContext( CommentSignals );
	const { strings, identity } = JetpackComments;

	const current = signedIn.value;

	if ( ! current ) {
		return null;
	}

	const leave = async () => {
		// A passport lives in an httponly cookie, so the site has to take it back.
		if ( current.code === null ) {
			await logOut();
		}

		signedIn.value = null;
		activeService.value = '';
	};

	return (
		<div className="jetpack-comments__identity jetpack-comments__identity--signed-in">
			<div className="jetpack-comments__signed-in">
				<div className="jetpack-comments__signed-in-heading">
					<div>
						<span className="jetpack-comments__signed-in-name">
							{ current.name }
							{ ` - ${ strings.loggedInVia.replace(
								'%s',
								strings.providers[ current.provider ]
							) } - ` }
						</span>
						<button type="button" className="jetpack-comments__logout" onClick={ leave }>
							{ strings.logOut }
						</button>
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
			</div>
			{ current.code !== null ? (
				<input type="hidden" name={ identity.codeField } value={ current.code } />
			) : (
				<input type="hidden" name={ identity.passportField } value="1" />
			) }
		</div>
	);
};
