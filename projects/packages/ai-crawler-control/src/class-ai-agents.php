<?php
/**
 * AI User Agents Utilities.
 *
 * @package automattic/jetpack-ai-crawler-control
 */

namespace Automattic\Jetpack;

/**
 * AI User Agents Utilities.
 */
class AI_Agents {
	/**
	 * Get a list of AI User Agents.
	 *
	 * @since $$next-version$$
	 *
	 * @return array
	 */
	public static function agent_list() {
		// Try to keep this list ordered alphabetically.
		$user_agents = array(
			'Amazonbot', // https://developer.amazon.com/support/amazonbot
			'anthropic-ai', // https://www.anthropic.com/
			'Bytespider', // https://www.bytedance.com/
			'CCBot', // https://commoncrawl.org/ccbot
			'ClaudeBot', // https://claude.ai/
			'cohere-ai', // https://cohere.com/
			'FacebookBot', // https://developers.facebook.com/docs/sharing/bot
			'Google-Extended', // https://blog.google/technology/ai/an-update-on-web-publisher-controls/
			'GPTBot', // https://platform.openai.com/docs/gptbot
			'omgili', // https://webz.io/blog/web-data/what-is-the-omgili-bot-and-why-is-it-crawling-your-website/
			'omgilibot', // https://webz.io/blog/web-data/what-is-the-omgili-bot-and-why-is-it-crawling-your-website/
			'SentiBot', // https://sentione.com/
			'sentibot', // https://sentione.com/
		);

		/**
		 * Filter the list of AI User Agents.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $user_agents List of AI User Agents.
		 */
		return apply_filters( 'jetpack_ai_control_agents_list', $user_agents );
	}
}
