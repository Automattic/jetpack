import { useBlockProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default () => {
	const blockProps = useBlockProps.save();

	return <div { ...blockProps } className={ classNames( 'wp-story', blockProps.className ) }></div>;
};
