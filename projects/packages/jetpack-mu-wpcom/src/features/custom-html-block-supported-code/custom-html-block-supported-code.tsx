import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const customHtmlSupportedCode = createHigherOrderComponent( BlockEdit => {
	return props => {
		return (
			<>
				<div>hey!</div>
				<BlockEdit { ...props } />
			</>
		);
	};
}, 'CustomHtmlSupportedCode' );

addFilter(
	'blocks.registerBlockType',
	'jetpack-mu-wpcom/custom-html-supported-code',
	( settings, name ) => {
		if ( name !== 'core/html' ) {
			return settings;
		}

		return {
			...settings,
			edit: customHtmlSupportedCode( settings.edit ),
		};
	}
);
