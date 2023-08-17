import './editor.scss';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

function PaidPlansEdit( { className } ) {
	return (
		<>
			<div { ...useBlockProps() } className={ className }>
				<ServerSideRender block="jetpack/paid-plans" />
			</div>
			<InspectorControls>
				<PanelBody initialOpen={ true } title={ __( 'Newsletter plans', 'jetpack' ) }>
					<ExternalLink href="https://wordpress.com/earn">Add or edit plans</ExternalLink>
				</PanelBody>
			</InspectorControls>
		</>
	);
}

export default PaidPlansEdit;
