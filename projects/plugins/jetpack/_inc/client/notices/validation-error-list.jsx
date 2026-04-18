import { _n } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import PropTypes from 'prop-types';

/**
 * Renders a list of validation error messages with a leading summary line.
 *
 * NOTE: This component is rendered inside a `SimpleNotice` by callers — the
 *       `SimpleNotice` + `NoticeAction` pairing is preserved on purpose. Use
 *       `@wordpress/ui` `Stack` only for the inner layout.
 * @param {object}   props          - Component props.
 * @param {string[]} props.messages - Validation error messages to display.
 * @return {JSX.Element} Rendered error list.
 */
function ValidationErrorList( { messages } ) {
	return (
		<Stack spacing={ 2 }>
			<p>
				{ _n(
					'Please correct the issue below and try again.',
					'Please correct the issues listed below and try again.',
					messages.length,
					'jetpack'
				) }
			</p>
			<ul>
				{ messages.map( ( message, index ) => (
					<li key={ index }>{ message }</li>
				) ) }
			</ul>
		</Stack>
	);
}

ValidationErrorList.displayName = 'ValidationErrorList';

ValidationErrorList.propTypes = {
	messages: PropTypes.array.isRequired,
};

export default ValidationErrorList;
