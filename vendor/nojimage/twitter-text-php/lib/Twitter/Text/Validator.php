<?php

/**
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text;

/**
 * Twitter Validator Class
 *
 * Performs "validation" on tweets.
 *
 * Originally written by {@link http://github.com/mikenz Mike Cochrane}, this
 * is based on code by {@link http://github.com/mzsanford Matt Sanford} and
 * heavily modified by {@link http://github.com/ngnpope Nick Pope}.
 *
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */
class Validator
{
    /**
     *
     * @var Extractor
     */
    protected $extractor;

    /**
     *
     * @var Configuration
     */
    protected $config;

    /**
     * Provides fluent method chaining.
     *
     * @param Configuration $config A Twitter Text Configuration
     *
     * @see __construct()
     *
     * @return Validator
     */
    public static function create(Configuration $config = null)
    {
        return new self($config);
    }

    /**
     * Reads in a tweet to be parsed and validates it.
     *
     * @param Configuration $config A Twitter Text Configuration
     */
    public function __construct(Configuration $config = null)
    {
        $this->setConfiguration($config);
        $this->extractor = Extractor::create();
    }

    /**
     * Setup configuration
     *
     * @see Configuration
     *
     * @param Configuration $config
     * @return Validator
     * @throws \InvalidArgumentException
     */
    public function setConfiguration(Configuration $config = null)
    {
        if ($config === null) {
            // default use v2 config
            $this->config = new Configuration();
        } elseif (is_a($config, '\Twitter\Text\Configuration')) {
            $this->config = $config;
        } else {
            throw new \InvalidArgumentException('Invalid Configuration');
        }

        return $this;
    }

    /**
     * Get current configuration
     *
     * @return Configuration
     */
    public function getConfiguration()
    {
        return $this->config;
    }

    /**
     * Check whether a tweet is valid.
     *
     * @param string        $tweet  The tweet to validate.
     * @param Configuration $config using configuration
     * @return boolean  Whether the tweet is valid.
     * @deprecated instead use \Twitter\Text\Parser::parseText()
     */
    public function isValidTweetText($tweet, Configuration $config = null)
    {

        return $this->parseTweet($tweet, $config)->valid;
    }

    /**
     * Check whether a username is valid.
     *
     * @param string $username The username to validate.
     * @return boolean  Whether the username is valid.
     */
    public function isValidUsername($username)
    {
        $length = StringUtils::strlen($username);
        if (empty($username) || !$length) {
            return false;
        }
        $extracted = $this->extractor->extractMentionedScreennames($username);
        return count($extracted) === 1 && $extracted[0] === substr($username, 1);
    }

    /**
     * Check whether a list is valid.
     *
     * @param string $list The list name to validate.
     * @return boolean  Whether the list is valid.
     */
    public function isValidList($list)
    {
        $length = StringUtils::strlen($list);
        if (empty($list) || !$length) {
            return false;
        }

        if (preg_match(Regex::getValidMentionsOrListsMatcher(), $list, $matches)) {
            $matches = array_pad($matches, 5, '');

            return $matches[1] === '' && !empty($matches[4]) && $matches[4] && $matches[5] === '';
        }

        return false;
    }

    /**
     * Check whether a hashtag is valid.
     *
     * @param string $hashtag The hashtag to validate.
     * @return boolean  Whether the hashtag is valid.
     */
    public function isValidHashtag($hashtag)
    {
        $length = StringUtils::strlen($hashtag);
        if (empty($hashtag) || !$length) {
            return false;
        }
        $extracted = $this->extractor->extractHashtags($hashtag);
        return count($extracted) === 1 && $extracted[0] === substr($hashtag, 1);
    }

    /**
     * Check whether a URL is valid.
     *
     * @param string   $url               The url to validate.
     * @param boolean  $unicode_domains   Consider the domain to be unicode.
     * @param boolean  $require_protocol  Require a protocol for valid domain?
     *
     * @return boolean  Whether the URL is valid.
     */
    public function isValidURL($url, $unicode_domains = true, $require_protocol = true)
    {
        $length = StringUtils::strlen($url);
        if (empty($url) || !$length) {
            return false;
        }

        preg_match(Regex::getValidateUrlUnencodedMatcher(), $url, $matches);
        $match = array_shift($matches);
        if (!$matches || $match !== $url) {
            return false;
        }

        list($scheme, $authority, $path, $query, $fragment) = array_pad($matches, 5, '');

        # Check scheme, path, query, fragment:
        if (
            ($require_protocol && !(
                self::isValidMatch($scheme, Regex::getValidateUrlSchemeMatcher())
                && preg_match('/^https?$/i', $scheme)
            ))
            || !self::isValidMatch($path, Regex::getValidateUrlPathMatcher())
            || !self::isValidMatch($query, Regex::getValidateUrlQueryMatcher(), true)
            || !self::isValidMatch($fragment, Regex::getValidateUrlFragmentMatcher(), true)
        ) {
            return false;
        }

        # Check authority:
        $authorityPattern = $unicode_domains ?
            Regex::getValidateUrlUnicodeAuthorityMatcher() :
            Regex::getValidateUrlAuthorityMatcher();

        return self::isValidMatch($authority, $authorityPattern);
    }

    /**
     * Determines the length of a tweet.  Takes shortening of URLs into account.
     *
     * @param string $tweet The tweet to validate.
     * @param Configuration $config using configuration
     * @return int  the length of a tweet.
     * @deprecated instead use \Twitter\Text\Parser::parseTweet()
     */
    public function getTweetLength($tweet, Configuration $config = null)
    {
        return $this->parseTweet($tweet, $config)->weightedLength;
    }

    /**
     * A helper function to check for a valid match.  Used in URL validation.
     *
     * @param string   $string    The subject string to test.
     * @param string   $pattern   The pattern to match against.
     * @param boolean  $optional  Whether a match is compulsory or not.
     *
     * @return boolean  Whether an exact match was found.
     */
    protected static function isValidMatch($string, $pattern, $optional = false)
    {
        $found = preg_match($pattern, $string, $matches);
        if (!$optional) {
            return (($string || $string === '') && $found && $matches[0] === $string);
        }

        return !(($string || $string === '') && (!$found || $matches[0] !== $string));
    }

    /**
     * Parse tweet
     *
     * @param string $tweet The tweet to parse.
     * @param Configuration|null $config using configuration
     * @return ParseResults
     */
    private function parseTweet($tweet, Configuration $config = null)
    {
        if ($config === null) {
            $config = $this->config;
        }

        return Parser::create($config)->parseTweet($tweet);
    }
}
