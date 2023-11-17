import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import classNames from 'classnames';
import SocialIcon from 'social-logos';
import './editor.scss';
import SharingButtonInspectorControls from './components/inspector-controls';
import { getNameBySite } from './utils';

const SocialLinkEdit = ( { attributes, context, setAttributes } ) => {
	const { service, label } = attributes;
	const { showLabels } = context;

	const socialLinkName = getNameBySite( service );
	const socialLinkLabel = label ?? socialLinkName;
	const blockProps = useBlockProps( {
		className: 'jetpack-sharing-button__list',
	} );

	return (
		<>
			<SharingButtonInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
				socialLinkLabel={ socialLinkName }
			/>
			<li { ...blockProps }>
				<Button className={ `jetpack-sharing-button__button share-${ service }` }>
					<SocialIcon icon={ service } size={ 24 } />
					<span
						className={ classNames( 'jetpack-sharing-buttons__service-label', {
							'screen-reader-text': ! showLabels,
						} ) }
					></span>
					{ socialLinkLabel }
				</Button>
			</li>
		</>
	);
};

export default SocialLinkEdit;
