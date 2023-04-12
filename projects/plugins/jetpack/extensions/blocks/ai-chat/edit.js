/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';
import QuestionAnswer from './question-answer';

/**
 * Block edit function
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<QuestionAnswer />
		</div>
	);
}
