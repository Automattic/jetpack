import { translate } from '../i18n';
import { EmailPostsChange } from '../types';
import { ToggleControl } from './ToggleControl';
import { EmailFrequencyGroup } from './email-frequency-group';

interface NewPostsEmailProps {
	handleOnChange: ( props: EmailPostsChange ) => void;
	isChecked: boolean;
	selectedOption: string;
	disabled?: boolean;
}

export const NewPostsEmail = ( {
	handleOnChange,
	isChecked,
	selectedOption,
	disabled = false,
}: NewPostsEmailProps ) => {
	const label = (
		<div className="verbum-toggle-control__label">
			<p className="primary">{ translate( 'Email me new posts' ) }</p>
		</div>
	);

	return (
		<div className="frequency-radio-group">
			<ToggleControl
				id="new-posts-email"
				checked={ isChecked }
				label={ label }
				disabled={ disabled }
				onChange={ ( e: boolean ) => {
					handleOnChange( {
						type: 'subscribe',
						value: e,
						trackSource: 'verbum-toggle',
					} );
				} }
			/>
			<EmailFrequencyGroup
				isChecked={ isChecked }
				selectedOption={ selectedOption }
				onChange={ e => {
					handleOnChange( {
						type: 'frequency',
						value: e,
						trackSource: 'verbum-toggle',
					} );
				} }
				label={ null }
				disabled={ disabled }
			/>
		</div>
	);
};
