<?php
/**
 * Stubs automatically generated from Akismet 5.4
 * using the definition file `tools/stubs/akismet-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

// We plan to gradually remove all of the disabled lint rules below.
// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
// phpcs:disable WordPress.Security.NonceVerification.Missing
// phpcs:disable Squiz.PHP.DisallowMultipleAssignments.FoundInControlStructure
class Akismet
{
    public static function get_api_key()
    {
    }
    public static function check_key_status($key, $ip = \null)
    {
    }
    public static function verify_key($key, $ip = \null)
    {
    }
    /**
     * Get the full comment history for a given comment, as an array in reverse chronological order.
     * Each entry will have an 'event', a 'time', and possible a 'message' member (if the entry is old enough).
     * Some entries will also have a 'user' or 'meta' member.
     *
     * @param int $comment_id The relevant comment ID.
     * @return array|bool An array of history events, or false if there is no history.
     */
    public static function get_comment_history($comment_id)
    {
    }
    public static function get_ip_address()
    {
    }
    /**
     * Make a POST request to the Akismet API.
     *
     * @param string $request The body of the request.
     * @param string $path The path for the request.
     * @param string $ip The specific IP address to hit.
     * @return array A two-member array consisting of the headers and the response body, both empty in the case of a failure.
     */
    public static function http_post($request, $path, $ip = \null)
    {
    }
}
// We plan to gradually remove all of the disabled lint rules below.
// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotValidated
// phpcs:disable WordPress.Security.ValidatedSanitizedInput.MissingUnslash
// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
// phpcs:disable Squiz.PHP.DisallowMultipleAssignments.FoundInControlStructure
// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped
class Akismet_Admin
{
    public static function admin_menu()
    {
    }
    public static function get_akismet_user($api_key)
    {
    }
    public static function display_page()
    {
    }
}
/**
 * @phan-return mixed Dummy doc for stub.
 */
function akismet_http_post($request, $host, $path, $port = 80, $ip = \null)
{
}
