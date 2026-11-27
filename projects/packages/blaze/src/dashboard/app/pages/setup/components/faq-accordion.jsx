import { useState } from '@wordpress/element';
import { Icon, chevronDown } from '@wordpress/icons';
import { Collapsible } from '@wordpress/ui';

/**
 *
 * @param root0
 * @param root0.question
 * @param root0.answer
 */
function FaqAccordion( { question, answer } ) {
	const [ isOpen, setIsOpen ] = useState( false );

	return (
		<Collapsible.Root className="blaze-faq-accordion" open={ isOpen } onOpenChange={ setIsOpen }>
			<Collapsible.Trigger className="blaze-faq-accordion__header">
				<span className="blaze-faq-accordion__question">{ question }</span>
				<Icon
					icon={ chevronDown }
					className={ `blaze-faq-accordion__icon ${ isOpen ? 'is-open' : '' }` }
				/>
			</Collapsible.Trigger>
			<Collapsible.Panel className="blaze-faq-accordion__content">{ answer }</Collapsible.Panel>
		</Collapsible.Root>
	);
}

export default FaqAccordion;
