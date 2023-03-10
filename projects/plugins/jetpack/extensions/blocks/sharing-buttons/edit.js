/**
 * External dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useState, useContext, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ServicesSelector from './components/ServicesSelector';
import SharingButtonsContext from './context';
import './editor.scss';
import availableServices from './available-services';

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
		setAttributes({ ...attributes, link: post.link });
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
			<SharingButtonsContext.Provider
				value={{
					post,
				}}
			>
				<ServicesSelector
					selectedServices={attributes.services}
					onServiceSelected={handleServiceSelect}
					services={availableServices}
				/>
			</SharingButtonsContext.Provider>
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
