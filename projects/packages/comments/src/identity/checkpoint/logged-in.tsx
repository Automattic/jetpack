import { useContext } from 'preact/hooks';
import { CommentSignals } from '../../shared/state';
import { SignedIn } from '../signed-in';
import { logOut } from './checkpoint';

import './style.scss';

export const LoggedIn = () => {
	const { signedIn, activeService, subscriptions } = useContext( CommentSignals );
	const { strings, identity } = JetpackComments;

	const current = signedIn.value;

	if ( ! current ) {
		return null;
	}

	const leave = async () => {
		// Even on a fresh code with no passport: the next popup must be told to ask the provider again.
		await logOut();

		signedIn.value = null;
		activeService.value = '';
		subscriptions.value = undefined;
	};

	return (
		<SignedIn
			heading={
				<>
					<span className="jetpack-comments__signed-in-name">
						{ `${ current.name } - ${ strings.loggedInVia[ current.provider ] } -` }
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
