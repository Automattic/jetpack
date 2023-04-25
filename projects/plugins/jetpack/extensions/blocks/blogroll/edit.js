import { useBlockProps } from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { className } = props;

	const blockProps = useBlockProps();

	return (
		<div className={ className } { ...blockProps }>
			<ServerSideRender block="jetpack/blogroll" />
		</div>
	);
}
