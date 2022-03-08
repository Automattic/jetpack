/**
 * External dependencies
 */
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { SVG, Path, Component } from '@wordpress/components';
import { QRCode } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import './editor.scss';

const QRIcon = () => (
	<SVG xmlns="https://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
		<Path d="M15,21h-2v-2h2V21z M13,14h-2v5h2V14z M21,12h-2v4h2V12z M19,10h-2v2h2V10z M7,12H5v2h2V12z M5,10H3v2h2V10z M12,5h2V3h-2V5 z M4.5,4.5v3h3v-3H4.5z M9,9H3V3h6V9z M4.5,16.5v3h3v-3H4.5z M9,21H3v-6h6V21z M16.5,4.5v3h3v-3H16.5z M21,9h-6V3h6V9z M19,19v-3 l-4,0v2h2v3h4v-2H19z M17,12l-4,0v2h4V12z M13,10H7v2h2v2h2v-2h2V10z M14,9V7h-2V5h-2v4L14,9z M6.75,5.25h-1.5v1.5h1.5V5.25z M6.75,17.25h-1.5v1.5h1.5V17.25z M18.75,5.25h-1.5v1.5h1.5V5.25z" />
	</SVG>
);

/**
 * React component that renders a QR code for the post,
 * pulling the post data from the editor store.
 *
 * @param {object} props   - Component props.
 * @returns {Component}   The react component.
 */
function QRPost( props ) {
	const {
		post: { title },
		permalink,
	} = useSelect(
		select => ( {
			post: select( editorStore ).getCurrentPost(),
			permalink: select( editorStore ).getPermalink(),
		} ),
		[]
	);

	const codeContent = `${ title } ${ permalink }`;

	return <QRCode value={ codeContent } size={ 248 } renderAs="canvas" { ...props } />;
}

export const name = 'post-publish-qr-post-panel';

export const settings = {
	render: function PluginPostPublishPanelQRPost() {
		return (
			<PluginPostPublishPanel
				name="post-publish-qr-post-panel"
				title={ __( 'QR Code', 'jetpack' ) }
				className="post-publish-qr-post-panel"
				icon={ <QRIcon /> }
				initialOpen={ true }
			>
				<div className="post-publish-qr-post-panel__container">
					<QRPost />
				</div>
			</PluginPostPublishPanel>
		);
	},
};
