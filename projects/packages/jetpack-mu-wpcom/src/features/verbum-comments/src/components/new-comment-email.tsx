import { translate } from '../i18n';
import { ToggleControl } from './ToggleControl';

interface NewCommentEmailProps {
	isChecked: boolean;
	handleOnChange: ( event: boolean ) => void;
	disabled: boolean;
}

export const NewCommentEmail = ( {
	isChecked,
	handleOnChange,
	disabled,
}: NewCommentEmailProps ) => {
	const label = (
		<div className="verbum-toggle-control__label">
			<p className="primary">{ translate( 'Email me new comments' ) }</p>
		</div>
	);

	return (
		<div>
			<ToggleControl
				disabled={ disabled }
				id="new-comment-email"
				checked={ isChecked }
				label={ label }
				onChange={ handleOnChange }
			/>
		</div>
	);
};
