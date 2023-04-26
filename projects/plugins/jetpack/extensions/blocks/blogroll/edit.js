import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { attributes, setAttributes, className } = props;
	const { blogroll_title, align } = attributes;

	const blockProps = useBlockProps();
	return (
		<div className={ className } { ...blockProps }>
			{ blogroll_title.trim() !== '' && (
				<div>
					<h1>{ blogroll_title }</h1>
				</div>
			) }
			<ServerSideRender block="jetpack/blogroll" attributes={ { blogroll_title, align } } />

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
		</div>
	);
}
