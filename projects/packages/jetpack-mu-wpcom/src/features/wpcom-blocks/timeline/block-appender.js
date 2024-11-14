import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const BlockAppender = props => {
	const { onClick } = props;
	return (
		<button
			className="block-editor-inserter__toggle timeline-item-appender components-button"
			type="button"
			style={ { zIndex: 99999 } }
			onClick={ onClick }
		>
			<SVG
				width="24"
				height="24"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				role="img"
				aria-hidden="true"
				focusable="false"
			>
				<Path d="M18 11.2h-5.2V6h-1.6v5.2H6v1.6h5.2V18h1.6v-5.2H18z"></Path>
			</SVG>{ ' ' }
			{ __( 'Add entry', 'jetpack-mu-wpcom' ) }
		</button>
	);
};

export default BlockAppender;
