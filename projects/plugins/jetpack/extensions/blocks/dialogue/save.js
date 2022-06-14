import { RichText } from '@wordpress/block-editor';
import { convertTimeCodeToSeconds } from '../../shared/components/media-player-control/utils';
import { BASE_CLASS_NAME } from './utils';

export default function save( { attributes } ) {
	const { content, label, showTimestamp, timestamp } = attributes;

	return (
		<div>
			<div className={ `${ BASE_CLASS_NAME }__meta` }>
				<RichText.Content
					className={ `${ BASE_CLASS_NAME }__participant has-bold-style` }
					tagName="div"
					value={ label }
				/>
				{ showTimestamp && (
					<div className={ `${ BASE_CLASS_NAME }__timestamp-label` }>
						<a
							className={ `${ BASE_CLASS_NAME }__timestamp_link` }
							href={ `#${ convertTimeCodeToSeconds( timestamp ) }` }
						>
							{ timestamp }
						</a>
					</div>
				) }
			</div>
			<RichText.Content
				className={ `${ BASE_CLASS_NAME }__content` }
				tagName="p"
				value={ content }
			/>
		</div>
	);
}
