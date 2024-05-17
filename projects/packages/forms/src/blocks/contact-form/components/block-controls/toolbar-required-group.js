import { ToolbarGroup, ToolbarButton, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../../util/render-material-icon';

const ToolbarRequiredGroup = ( { required, onClick } ) => {
	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ __( 'Required', 'jetpack-forms' ) }
				icon={ renderMaterialIcon(
					<Path
						d="M8.23118 8L16 16M8 16L15.7688 8 M6.5054 11.893L17.6567 11.9415M12.0585 17.6563L12 6.5"
						stroke="currentColor"
					/>
				) }
				onClick={ onClick }
				className={ required ? 'is-pressed' : undefined }
			/>
		</ToolbarGroup>
	);
};

export default ToolbarRequiredGroup;
