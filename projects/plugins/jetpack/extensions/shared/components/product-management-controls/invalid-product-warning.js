import { Warning } from '@wordpress/block-editor';
import { Icon, warning } from '@wordpress/icons';
import { useProductManagementContext } from './context';
import { getMessageByProductType } from './utils';

export default function InvalidProductWarning() {
	const { productType } = useProductManagementContext();
	return (
		<Warning className="product-management-control-nudge">
			<span className="product-management-control-nudge__info">
				{ <Icon icon={ warning } /> }
				<span className="product-management-control-nudge__text-container">
					<span className="product-management-control-nudge__title">
						{ getMessageByProductType( 'invalid product configured for this block', productType ) }
					</span>
					<span className="product-management-control-nudge__message">
						{ getMessageByProductType(
							'the button will be hidden from your visitors until you select a valid product',
							productType
						) }
					</span>
				</span>
			</span>
		</Warning>
	);
}
