import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';

const requiredIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path
			d="M8.23118 8L16 16M8 16L15.7688 8 M6.5054 11.893L17.6567 11.9415M12.0585 17.6563L12 6.5"
			stroke="currentColor"
		/>
	</SVG>
);

const ToolbarRequiredGroup = ( { required, onClick, disabled = false, disabledTooltip = '' } ) => {
	const title = disabled && disabledTooltip ? disabledTooltip : __( 'Required', 'jetpack-forms' );
	return (
		<ToolbarGroup>
			<ToolbarButton
				title={ title }
				icon={ requiredIcon }
				onClick={ onClick }
				className={ required ? 'is-pressed' : undefined }
				disabled={ disabled }
			/>
		</ToolbarGroup>
	);
};

export default ToolbarRequiredGroup;
