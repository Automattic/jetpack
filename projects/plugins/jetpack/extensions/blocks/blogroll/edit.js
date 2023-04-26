import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { attributes, setAttributes, className } = props;
	const { blogroll_title, hide_invisible, limit } = attributes;

	const blockProps = useBlockProps();

	function onChangeHideInvisible() {
		setAttributes( { hide_invisible: ! hide_invisible } );
	}
	return (
		<div className={ className } { ...blockProps }>
			<ServerSideRender block="jetpack/blogroll" attributes={ attributes } />

			<InspectorControls>
				<PanelBody title={ 'Blogroll Title' }>
					<TextControl
						type="text"
						label={ __( 'Blogroll title', 'jetpack' ) }
						value={ blogroll_title }
						onChange={ value => setAttributes( { blogroll_title: value } ) }
					/>

					<ToggleControl
						label={ __( 'Hide invisible', 'jetpack' ) }
						checked={ !! hide_invisible }
						onChange={ onChangeHideInvisible }
					/>

					<TextControl
						label={ __( 'Limit', 'jetpack' ) }
						type={ 'number' }
						value={ limit }
						onChange={ value => setAttributes( { limit: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}
