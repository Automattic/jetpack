import { useContext } from 'preact/hooks';
import { CommentSignals } from '../../shared/state';
import { SignedIn } from '../signed-in';
import { logOut } from './checkpoint';

import './style.scss';

/**
 * Who the popup signed in, and a way out. A fresh sign-in posts its code; a
 * returning one posts a marker, so the server uses the passport only when
 * this was on screen.
 *
 * @return The signed-in identity block.
 */
export const LoggedIn = () => {
	const { signedIn, activeService, subscriptions } = useContext( CommentSignals );
	const { strings, identity } = JetpackComments;

	const current = signedIn.value;

	if ( ! current ) {
		return null;
	}

	const leave = async () => {
		// Always, even on a fresh code with no passport yet: the site takes back
		// any httponly cookie, and the next popup is told to ask the provider again.
		await logOut();

		signedIn.value = null;
		activeService.value = '';
		// Read again for whoever signs in next.
		subscriptions.value = undefined;
	};

	return (
		<SignedIn
			heading={
				<>
					<span className="jetpack-comments__signed-in-name">
						{ strings.signedInAs
							.replace( '%1$s', () => current.name )
							.replace( '%2$s', () => strings.providers[ current.provider ] ) }
					</span>{ ' ' }
					<button type="button" className="jetpack-comments__logout" onClick={ leave }>
						{ strings.logOut }
					</button>
				</>
			}
		>
			{ current.code !== null ? (
				<input type="hidden" name={ identity.codeField } value={ current.code } />
			) : (
				<input type="hidden" name={ identity.passportField } value="1" />
			) }
		</SignedIn>
	);
};
