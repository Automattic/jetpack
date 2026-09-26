import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { SettingsButton } from './settings-button';
import { SubmitButton } from './submit-button';

import './style.scss';

export const Footer = () => {
	const { isSignedIn } = useContext( CommentSignals );

	return (
		<div className="jetpack-comments__footer">
			{ isSignedIn.value && <SettingsButton /> }
			<SubmitButton />
		</div>
	);
};
