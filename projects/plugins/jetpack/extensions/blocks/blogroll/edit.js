import { useBlockProps, InspectorControls, InnerBlocks } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { attributes, setAttributes, className } = props;
	const { blogroll_title } = attributes;

	const blockProps = useBlockProps();
	return (
		<div className={ className } { ...blockProps }>
			<ServerSideRender block="jetpack/blogroll" />
			<InspectorControls>
				<PanelBody title={ 'Blogroll Title' }>
					<TextControl
						type="text"
						label={ __( 'Blogroll title', 'jetpack' ) }
						value={ blogroll_title }
						onChange={ value => setAttributes( { blogroll_title: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div>
				<InnerBlocks allowedBlocks={ [ 'jetpack/blogroll-item' ] } orientation="vertical" />
			</div>
		</div>
	);
}
