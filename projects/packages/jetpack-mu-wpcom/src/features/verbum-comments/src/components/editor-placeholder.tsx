import { Spinner } from '@wordpress/components';
import { classNames } from '../utils';
import { translate } from '../i18n';

export const EditorPlaceholder = ( { onClick, loading } ) => {
	return (
		<div
			className="verbum-editor-wrapper"
			role="presentation"
			onClick={ onClick }
			onKeyDown={ onClick }
		>
			<div
				class={ classNames( 'editor__main loading-placeholder', {
					loading,
				} ) }
			>
				<div
					class="block-list-appender block-editor-block-list__layout"
					style={ { padding: '10px 20px' } }
				>
					{ loading ? (
						<Spinner style={ { display: 'block', margin: '0 auto' } } />
					) : (
						<p
							class="block-editor-block-list__layout__content"
							style={ { margin: '18px 0', fontSize: '16px' } }
						>
							{ translate( 'Leave a comment' ) }
						</p>
					) }
				</div>
			</div>
		</div>
	);
};
