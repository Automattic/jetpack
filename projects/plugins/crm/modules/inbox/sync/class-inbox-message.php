<?php
/**
 * Inbox Message Class
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack_CRM\Modules\Inbox;

use JsonSerializable;

/**
 * Inbox Message.
 *
 * The Inbox Message represents a single message sent to the CRM.
 *
 * @since $$next-version$$
 */
class Inbox_Message implements JsonSerializable {

	/**
	 * The id that identifies the contact which sent the message.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	protected $sender_contact_id;

	/**
	 * The subject for this message.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	protected $subject;

	/**
	 * The message content.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	protected $content;

	/**
	 * Message type (is it an email? a sms?).
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	protected $type;

	/**
	 * The date the message was sent in Unix timestamp and UTC timezone.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	protected $sent_date;

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $sender_contact_id The id that identifies the contact which sent the message.
	 * @param string $subject           The subject of the message.
	 * @param string $content           The content of the message.
	 * @param string $type              The type of message.
	 * @param int    $sent_date         The date the message was sent in Unix timestamp and UTC timezone.
	 */
	public function __construct( $sender_contact_id, $subject, $content, $type, $sent_date ) {
		$this->sender_contact_id = $sender_contact_id;
		$this->subject           = $subject;
		$this->content           = $content;
		$this->type              = $type;
		$this->sent_date         = $sent_date;
	}

	/**
	 * Get the sender contact id.
	 *
	 * @since $$next-version$$
	 *
	 * @return int
	 */
	public function get_sender_contact_id(): int {
		return $this->sender_contact_id;
	}

	/**
	 * Set the sender contact id.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $sender_contact_id The id that identifies the contact which sent the message.
	 */
	public function set_sender_contact_id( int $sender_contact_id ): void {
		$this->sender_contact_id = $sender_contact_id;
	}

	/**
	 * Get the subject.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public function get_subject(): string {
		return $this->subject;
	}

	/**
	 * Set the subject.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $subject The subject of the message.
	 */
	public function set_subject( string $subject ): void {
		$this->subject = $subject;
	}

	/**
	 * Get the content.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public function get_content(): string {
		return $this->content;
	}

	/**
	 * Set the content.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $content The content of the message.
	 */
	public function set_content( string $content ): void {
		$this->content = $content;
	}

	/**
	 * Get the type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public function get_type(): string {
		return $this->type;
	}

	/**
	 * Set the type.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $type The type of the message.
	 */
	public function set_type( string $type ): void {
		$this->type = $type;
	}

	/**
	 * Get the sent date.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public function get_sent_date(): string {
		return $this->sent_date;
	}

	/**
	 * Set the sent date.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $sent_date The date the message was sent.
	 */
	public function set_sent_date( string $sent_date ): void {
		$this->sent_date = $sent_date;
	}

	/**
	 * Implement jsonSerialize
	 *
	 * @since $$next-version$$
	 *
	 * @return array
	 */
	public function jsonSerialize() {
		return array(
			'sender_contact_id' => $this->get_sender_contact_id(),
			'subject'           => $this->get_subject(),
			'content'           => $this->get_content(),
			'type'              => $this->get_type(),
			'sent_date'         => $this->get_sent_date(),
		);
	}
}
