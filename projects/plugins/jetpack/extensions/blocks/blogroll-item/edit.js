import { useBlockProps } from '@wordpress/block-editor';
import { TextControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './editor.scss';

export default function Edit( props ) {
	const { isSelected } = props;

	const blockProps = useBlockProps();
	return (
		<div className="blogroll-item" { ...blockProps }>
			{ isSelected ? (
				<>
					<TextControl type="text" label={ __( 'Title', 'jetpack' ) } />
					<TextControl type="text" label={ __( 'Url', 'jetpack' ) } />
				</>
			) : (
				<>
					<TextControl type="text" label={ __( 'Title', 'jetpack' ) } />
					<ExternalLink href="https://wordpress.org">WordPress.org</ExternalLink>
				</>
			) }
		</div>
	);
}
