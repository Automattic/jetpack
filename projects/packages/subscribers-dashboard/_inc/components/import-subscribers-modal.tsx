/**
 * External dependencies
 */
import { Modal, Button, Notice } from '@wordpress/components';
import { useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getSiteData } from '@automattic/jetpack-script-data';

/**
 * Internal dependencies
 */
import './import-subscribers-modal.scss';

interface ImportSubscribersModalProps {
	isOpen: boolean;
	onRequestClose: () => void;
}

/**
 * Check if the current site has a free plan
 *
 * @return {boolean} Whether the site has a free plan
 */
const isFreePlan = (): boolean => {
	const siteData = getSiteData();
	const productSlug = siteData?.plan?.product_slug || '';
	
	// Free plans typically have 'free' in their product slug
	return productSlug.includes( 'free' ) || productSlug === 'jetpack_free' || productSlug === '';
};

/**
 * ImportSubscribersModal component
 *
 * Displays a modal for importing subscribers with plan-based limit messaging
 *
 * @param {ImportSubscribersModalProps} props - Component props
 * @return {JSX.Element|null} The modal component
 */
const ImportSubscribersModal = ( { isOpen, onRequestClose }: ImportSubscribersModalProps ) => {
	const [ selectedFile, setSelectedFile ] = useState< File | null >( null );
	const [ categories, setCategories ] = useState< string >( '' );
	const isFree = isFreePlan();
	const siteData = getSiteData();
	const siteUrl = siteData?.wpcom?.blog_id 
		? `https://wordpress.com/plans/${ siteData.wpcom.blog_id }` 
		: 'https://wordpress.com/plans';

	if ( ! isOpen ) {
		return null;
	}

	const handleFileChange = ( event: React.ChangeEvent< HTMLInputElement > ) => {
		const file = event.target.files?.[ 0 ];
		if ( file ) {
			setSelectedFile( file );
		}
	};

	const handleImport = () => {
		// TODO: Implement actual import logic
		// This is a placeholder for the import functionality
		console.log( 'Import:', { file: selectedFile, categories } );
		onRequestClose();
	};

	return (
		<Modal
			title={ __( 'Add Subscribers', 'jetpack-subscribers-dashboard' ) }
			onRequestClose={ onRequestClose }
			className="jetpack-subscribers-import-modal"
		>
			<div className="jetpack-subscribers-import-modal__content">
				<div className="jetpack-subscribers-import-modal__section">
					<label htmlFor="csv-file-upload">
						{ __( 'Upload CSV file', 'jetpack-subscribers-dashboard' ) }
					</label>
					<input
						id="csv-file-upload"
						type="file"
						accept=".csv"
						onChange={ handleFileChange }
					/>
					{ selectedFile && (
						<p className="jetpack-subscribers-import-modal__file-name">
							{ sprintf(
								/* translators: %s: name of the selected file */
								__( 'Selected file: %s', 'jetpack-subscribers-dashboard' ),
								selectedFile.name
							) }
						</p>
					) }
				</div>

				<div className="jetpack-subscribers-import-modal__section">
					<label htmlFor="subscriber-categories">
						{ __( 'Categories', 'jetpack-subscribers-dashboard' ) }
					</label>
					<input
						id="subscriber-categories"
						type="text"
						value={ categories }
						onChange={ ( e ) => setCategories( e.target.value ) }
						placeholder={ __( 'Enter categories (optional)', 'jetpack-subscribers-dashboard' ) }
					/>
					<p className="jetpack-subscribers-import-modal__help-text">
						{ __( 'Separate multiple categories with commas', 'jetpack-subscribers-dashboard' ) }
					</p>
				</div>

				{ /* Plan-based limit messaging */ }
				<div className="jetpack-subscribers-import-modal__limits">
					{ isFree ? (
						<Notice status="info" isDismissible={ false }>
							<span>
								{ createInterpolateElement(
									__(
										'Free plans have an import limit of 100 subscribers. <a>Upgrade your plan</a> to import unlimited subscribers.',
										'jetpack-subscribers-dashboard'
									),
									{
										a: <a href={ siteUrl } target="_blank" rel="noopener noreferrer" />,
									}
								) }
							</span>
						</Notice>
					) : (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Imports of more than 10,000 subscribers will go through a manual review before being added to your site.',
								'jetpack-subscribers-dashboard'
							) }
						</Notice>
					) }
				</div>

				<div className="jetpack-subscribers-import-modal__fine-print">
					<p>
						{ __(
							'By uploading this file, you confirm that you have permission to email these subscribers.',
							'jetpack-subscribers-dashboard'
						) }
					</p>
				</div>

				<div className="jetpack-subscribers-import-modal__actions">
					<Button variant="secondary" onClick={ onRequestClose }>
						{ __( 'Cancel', 'jetpack-subscribers-dashboard' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleImport }
						disabled={ ! selectedFile }
					>
						{ __( 'Import', 'jetpack-subscribers-dashboard' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default ImportSubscribersModal;
