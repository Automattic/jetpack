<?php
/**
 * Jetpack AI POC Agent using Neuron AI Framework.
 *
 * @package automattic/jetpack-ai-poc
 */

use NeuronAI\Agent;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Anthropic\Anthropic;
use NeuronAI\SystemPrompt;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Agent
 *
 * Extends Neuron AI Agent with WordPress Abilities as tools.
 */
class Jetpack_AI_POC_Agent extends Agent {

	/**
	 * Anthropic API key.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * Anthropic model.
	 *
	 * @var string
	 */
	private $model_name;

	/**
	 * Set API key and model.
	 *
	 * @param string $api_key Anthropic API key.
	 * @param string $model Model to use.
	 * @return self
	 */
	public function with_credentials( $api_key, $model = 'claude-3-5-sonnet-20241022' ) {
		$this->api_key    = $api_key;
		$this->model_name = $model;
		return $this;
	}

	/**
	 * Define the AI provider (Anthropic Claude).
	 *
	 * @return AIProviderInterface
	 */
	protected function provider(): AIProviderInterface {
		$api_key = $this->api_key ? $this->api_key : get_option( 'jetpack_ai_poc_anthropic_key' );
		$model   = $this->model_name ? $this->model_name : 'claude-3-5-sonnet-20241022';

		return new Anthropic( $api_key, $model );
	}

	/**
	 * Define the agent's system instructions.
	 *
	 * @return string
	 */
	public function instructions(): string {
		return (string) new SystemPrompt(
			background: array(
				'You are a helpful WordPress assistant powered by Jetpack.',
				'You have access to WordPress abilities that allow you to perform various tasks on the WordPress site.',
				'When users ask you to perform actions, you MUST use the available tools to actually execute those actions.',
				'Never pretend or simulate actions - always use the provided tools to make real changes.',
			),
			steps: array(
				'1. Understand what the user is asking you to do',
				'2. Identify which tool(s) can accomplish the task',
				'3. Use the appropriate tool(s) with the correct parameters',
				'4. Report back to the user with the actual results from the tool execution',
			),
			toolsUsage: array(
				'ALWAYS use the available tools when users ask you to perform actions',
				'NEVER say you have done something without actually calling the tool',
				'If a tool returns an error, report the actual error to the user',
				'Only respond with success after the tool has been executed successfully',
			)
		);
	}

	/**
	 * Define the tools (WordPress Abilities) available to the agent.
	 *
	 * @return array
	 */
	protected function tools(): array {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return array();
		}

		$abilities = wp_get_abilities();
		$tools     = array();

		foreach ( $abilities as $ability ) {
			$tools[] = new Jetpack_AI_POC_Ability_Tool( $ability );
		}

		return $tools;
	}
}
