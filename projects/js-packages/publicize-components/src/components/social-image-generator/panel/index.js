import { PanelBody } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// import { useSelect, useDispatch } from '@wordpress/data';
// import { store as editorStore } from '@wordpress/editor';

const SocialImageGeneratorPanel = ( { prePublish = false } ) => {
	const PanelWrapper = prePublish ? Fragment : PanelBody;
	const wrapperProps = prePublish ? {} : { title: __( 'Social Image Generator', 'jetpack' ) };

	return <PanelWrapper { ...wrapperProps }>Hi</PanelWrapper>;
};

export default SocialImageGeneratorPanel;
