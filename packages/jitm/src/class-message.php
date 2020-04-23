<?php
/**
 * Jetpack's JITM Message class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

/**
 * Class JITM\Message
 *
 * Represents a message the client should display
 */
class Message {
	/**
	 * Message ID
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Message content
	 *
	 * @var string
	 */
	protected $content;

	/**
	 * Call to action
	 *
	 * @var string
	 */
	protected $cta;

	/**
	 * Class constructor
	 *
	 * @param string $id Message ID.
	 */
	public function __construct( $id ) {
		$this->id      = $id;
		$this->content = array(
			'message' => '',
			'icon'    => 'jetpack',
			'list'    => array(),
		);
		$this->cta     = array(
			'message'   => '',
			'hook'      => null,
			'newWindow' => false,
			'primary'   => true,
		);
	}

	/**
	 * Renders the internal state to a simple object
	 *
	 * @return \stdClass|bool The simple object
	 */
	public function render() {

		$obj                 = new \stdClass();
		$obj->content        = $this->content;
		$obj->cta            = $this->cta;
		$obj->id             = $this->id;
		$obj->is_dismissible = true;

		return $obj;
	}

	/**
	 * Show the specified message to the user
	 *
	 * @param string $message The message.
	 * @param string $description A longer description that shows up under the message.
	 *
	 * @return $this
	 */
	public function show( $message, $description = '' ) {
		$this->content['message']     = $message;
		$this->content['description'] = $description;

		return $this;
	}

	/**
	 * The message path that needs to match before showing
	 *
	 * @param string $regex The message path regex.
	 *
	 * @return $this
	 */
	public function message_path( $regex ) {
		$this->message_path_regex = $regex;

		return $this;
	}

	/**
	 * A call to action
	 *
	 * @param string $cta The message to display on the CTA button.
	 * @param string $link URL.
	 *
	 * @return $this
	 */
	public function with_cta( $cta, $link = '' ) {
		$this->cta['message'] = $cta;
		$this->cta['link']    = $link;

		return $this;
	}

}
