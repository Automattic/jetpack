import { useBlockProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default ( { className } ) => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<div className={ classNames( 'wp-story', className ) }></div>
		</div>
	);
};
