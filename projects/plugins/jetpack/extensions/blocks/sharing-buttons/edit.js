/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import availableServices from './available-services';
import ServicesSelector from './components/ServicesSelector';
import './editor.scss';

/**
 * Write the block editor UI.
 *
 * @returns {object} The UI displayed when user edits this block.
 */
function SharingButtonsEdit({ attributes, className, noticeOperations, noticeUI, setAttributes }) {
	const { post } = useSelect(
		select => {
			const { getCurrentPost } = select('core/editor');
			return {
				post: getCurrentPost(),
			};
		},
		[attributes]
	);

	useEffect(() => {
		setAttributes({ ...attributes, post });
	}, [post, setAttributes]);

	const handleServiceSelect = service => {
		const { services } = attributes;
		// Remove service from services if present and return
		if (Array.isArray(services) && services.includes(service)) {
			setAttributes({ ...attributes, services: services.filter(item => item !== service) });
			return;
		}

		const newServices = Array.isArray(services) ? services.concat(service) : [service];
		setAttributes({ ...attributes, services: newServices });
	};

	return (
		<div className={className}>
			<ServicesSelector
				selectedServices={attributes.services}
				onServiceSelected={handleServiceSelect}
				services={availableServices}
			/>
			<Instructions />
		</div>
	);
}

function Instructions() {
	return createInterpolateElement(
		__('Customize your sharing settings via <a>Jetpack Sharing Settings</a>', 'jetpack'),
		{
			a: <a href="/wp-admin/admin.php?page=jetpack#/sharing" target="_blank" />,
		}
	);
}

export default SharingButtonsEdit;
