<?php

/**
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text;

/**
 * Twitter Extractor Class
 *
 * Parses tweets and extracts URLs, usernames, username/list pairs and
 * hashtags.
 *
 * Originally written by {@link http://github.com/mikenz Mike Cochrane}, this
 * is based on code by {@link http://github.com/mzsanford Matt Sanford} and
 * heavily modified by {@link http://github.com/ngnpope Nick Pope}.
 *
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */
class Extractor
{

    /**
     * The maximum url length that the Twitter backend supports.
     */
    const MAX_URL_LENGTH = 4096;

    /**
     * The backend adds http:// for normal links and https to *.twitter.com URLs (it also rewrites http to https for
     * URLs matching *.twitter.com). We're better off adding https:// all the time.
     * By making the assumption that URL_GROUP_PROTOCOL_LENGTH is https, the trade off is we'll disallow a http URL
     * that is 4096 characters.
     */
    const URL_GROUP_PROTOCOL_LENGTH = 4104; // https:// + MAX_URL_LENGTH

    /**
     * The maximum t.co path length that the Twitter backend supports.
     */
    const MAX_TCO_SLUG_LENGTH = 40;

    /**
     * The maximum hostname length that the ASCII domain.
     */
    const MAX_ASCII_HOSTNAME_LENGTH = 63;

    /**
     * @var boolean
     */
    protected $extractURLWithoutProtocol = true;

    /**
     * Provides fluent method chaining.
     *
     * @see __construct()
     *
     * @return Extractor
     */
    public static function create()
    {
        return new self();
    }

    /**
     * Reads in a tweet to be parsed and extracts elements from it.
     *
     * Extracts various parts of a tweet including URLs, usernames, hashtags...
     */
    public function __construct()
    {
    }

    /**
     * Extracts all parts of a tweet and returns an associative array containing
     * the extracted elements.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The elements in the tweet.
     */
    public function extract($tweet)
    {
        return array(
            'hashtags' => $this->extractHashtags($tweet),
            'cashtags' => $this->extractCashtags($tweet),
            'urls' => $this->extractURLs($tweet),
            'mentions' => $this->extractMentionedScreennames($tweet),
            'replyto' => $this->extractReplyScreenname($tweet),
            'hashtags_with_indices' => $this->extractHashtagsWithIndices($tweet),
            'urls_with_indices' => $this->extractURLsWithIndices($tweet),
            'mentions_with_indices' => $this->extractMentionedScreennamesWithIndices($tweet),
        );
    }

    /**
     * Extract URLs, @mentions, lists and #hashtag from a given text/tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array list of extracted entities
     */
    public function extractEntitiesWithIndices($tweet)
    {
        $entities = array();
        $entities = array_merge($entities, $this->extractURLsWithIndices($tweet));
        $entities = array_merge($entities, $this->extractHashtagsWithIndices($tweet, false));
        $entities = array_merge($entities, $this->extractMentionsOrListsWithIndices($tweet));
        $entities = array_merge($entities, $this->extractCashtagsWithIndices($tweet));
        $entities = $this->removeOverlappingEntities($entities);
        return $entities;
    }

    /**
     * Extracts all the hashtags from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The hashtag elements in the tweet.
     */
    public function extractHashtags($tweet)
    {
        $hashtagsOnly = array();
        $hashtagsWithIndices = $this->extractHashtagsWithIndices($tweet);

        foreach ($hashtagsWithIndices as $hashtagWithIndex) {
            $hashtagsOnly[] = $hashtagWithIndex['hashtag'];
        }
        return $hashtagsOnly;
    }

    /**
     * Extracts all the cashtags from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The cashtag elements in the tweet.
     */
    public function extractCashtags($tweet)
    {
        $cashtagsOnly = array();
        $cashtagsWithIndices = $this->extractCashtagsWithIndices($tweet);

        foreach ($cashtagsWithIndices as $cashtagWithIndex) {
            $cashtagsOnly[] = $cashtagWithIndex['cashtag'];
        }
        return $cashtagsOnly;
    }

    /**
     * Extracts all the URLs from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The URL elements in the tweet.
     */
    public function extractURLs($tweet)
    {
        $urlsOnly = array();
        $urlsWithIndices = $this->extractURLsWithIndices($tweet);

        foreach ($urlsWithIndices as $urlWithIndex) {
            $urlsOnly[] = $urlWithIndex['url'];
        }
        return $urlsOnly;
    }

    /**
     * Extract all the usernames from the tweet.
     *
     * A mention is an occurrence of a username anywhere in a tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The usernames elements in the tweet.
     */
    public function extractMentionedScreennames($tweet)
    {
        $usernamesOnly = array();
        $mentionsWithIndices = $this->extractMentionsOrListsWithIndices($tweet);

        foreach ($mentionsWithIndices as $mentionWithIndex) {
            if (empty($mentionWithIndex['screen_name'])) {
                continue;
            }
            $usernamesOnly[] = $mentionWithIndex['screen_name'];
        }
        return $usernamesOnly;
    }

    /**
     * Extract all the usernames replied to from the tweet.
     *
     * A reply is an occurrence of a username at the beginning of a tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The usernames replied to in a tweet.
     */
    public function extractReplyScreenname($tweet)
    {
        $matched = preg_match(Regex::getValidReplyMatcher(), $tweet, $matches);
        # Check username ending in
        if ($matched && preg_match(Regex::getEndMentionMatcher(), $matches[2])) {
            $matched = false;
        }
        return $matched ? $matches[1] : null;
    }

    /**
     * Extracts all the emoji and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The emoji chars in the tweet.
     */
    public function extractEmojiWithIndices($tweet)
    {
        preg_match_all(EmojiRegex::VALID_EMOJI_PATTERN, $tweet, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        $entities = array();

        foreach ($matches as $match) {
            list($emoji) = $match;
            list($emojiChar, $offset) = $emoji;
            $startPosition = StringUtils::strlen(substr($tweet, 0, $offset));
            $endPosition = $startPosition + StringUtils::strlen($emojiChar) - 1;

            $entities[] = array(
                'emoji' => $emoji[0],
                'indices' => array($startPosition, $endPosition)
            );
        }

        return $entities;
    }

    /**
     * Extracts all the hashtags and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @param boolean $checkUrlOverlap if true, check if extracted hashtags overlap URLs and remove overlapping ones
     * @return array  The hashtag elements in the tweet.
     */
    public function extractHashtagsWithIndices($tweet, $checkUrlOverlap = true)
    {
        if (!preg_match('/[#＃]/u', $tweet)) {
            return array();
        }

        preg_match_all(Regex::getValidHashtagMatcher(), $tweet, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        $tags = array();

        foreach ($matches as $match) {
            list($all, $before, $hash, $hashtag, $outer) = array_pad($match, 3, array('', 0));
            $start_position = $hash[1] > 0 ? StringUtils::strlen(substr($tweet, 0, $hash[1])) : $hash[1];
            $end_position = $start_position + StringUtils::strlen($hash[0] . $hashtag[0]);

            if (preg_match(Regex::getEndHashtagMatcher(), $outer[0])) {
                continue;
            }

            $tags[] = array(
                'hashtag' => $hashtag[0],
                'indices' => array($start_position, $end_position)
            );
        }

        if (!$checkUrlOverlap) {
            return $tags;
        }

        # check url overlap
        $urls = $this->extractURLsWithIndices($tweet);
        $entities = $this->removeOverlappingEntities(array_merge($tags, $urls));

        $validTags = array();
        foreach ($entities as $entity) {
            if (empty($entity['hashtag'])) {
                continue;
            }
            $validTags[] = $entity;
        }

        return $validTags;
    }

    /**
     * Extracts all the cashtags and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The cashtag elements in the tweet.
     */
    public function extractCashtagsWithIndices($tweet)
    {
        if (!preg_match('/\$/u', $tweet)) {
            return array();
        }

        preg_match_all(Regex::getValidCashtagMatcher(), $tweet, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        $tags = array();

        foreach ($matches as $match) {
            list($all, $before, $dollar, $cash_text, $outer) = array_pad($match, 3, array('', 0));
            $start_position = $dollar[1] > 0 ? StringUtils::strlen(substr($tweet, 0, $dollar[1])) : $dollar[1];
            $end_position = $start_position + StringUtils::strlen($dollar[0] . $cash_text[0]);

            if (preg_match(Regex::getEndHashtagMatcher(), $outer[0])) {
                continue;
            }

            $tags[] = array(
                'cashtag' => $cash_text[0],
                'indices' => array($start_position, $end_position)
            );
        }

        return $tags;
    }

    /**
     * Extracts all the URLs and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The URLs elements in the tweet.
     */
    public function extractURLsWithIndices($tweet)
    {
        $needle = $this->extractURLWithoutProtocol() ? '.' : ':';
        if (strpos($tweet, $needle) === false) {
            return array();
        }

        $urls = array();
        preg_match_all(Regex::getValidUrlMatcher(), $tweet, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

        foreach ($matches as $match) {
            list($all, $before, $url, $protocol, $domain, $port, $path, $query) = array_pad($match, 8, array(''));
            $start_position = $url[1] > 0 ? StringUtils::strlen(substr($tweet, 0, $url[1])) : $url[1];
            $end_position = $start_position + StringUtils::strlen($url[0]);

            $all = $all[0];
            $before = $before[0];
            $url = $url[0];
            $protocol = $protocol[0];
            $domain = $domain[0];
            $port = $port[0];
            $path = $path[0];
            $query = $query[0];

            // If protocol is missing and domain contains non-ASCII characters,
            // extract ASCII-only domains.
            if (empty($protocol)) {
                if (
                    !$this->extractURLWithoutProtocol
                    || preg_match(Regex::getInvalidUrlWithoutProtocolPrecedingCharsMatcher(), $before)
                ) {
                    continue;
                }

                $last_url = null;
                $ascii_end_position = 0;

                if (preg_match(Regex::getValidAsciiDomainMatcher(), $domain, $asciiDomain)) {
                    // check hostname length
                    if (
                        isset($asciiDomain[1])
                        && strlen(rtrim($asciiDomain[1], '.')) > static::MAX_ASCII_HOSTNAME_LENGTH
                    ) {
                        continue;
                    }

                    $asciiDomain[0] = preg_replace('/' . preg_quote($domain, '/') . '/u', $asciiDomain[0], $url);
                    $ascii_start_position = StringUtils::strpos($domain, $asciiDomain[0], $ascii_end_position);
                    $ascii_end_position = $ascii_start_position + StringUtils::strlen($asciiDomain[0]);
                    $last_url = array(
                        'url' => $asciiDomain[0],
                        'indices' => array(
                            $start_position + $ascii_start_position,
                            $start_position + $ascii_end_position
                        ),
                    );
                    if (
                        !empty($path)
                        || preg_match(Regex::getValidSpecialShortDomainMatcher(), $asciiDomain[0])
                        || !preg_match(Regex::getInvalidCharactersMatcher(), $asciiDomain[0])
                    ) {
                        $urls[] = $last_url;
                    }
                }

                // no ASCII-only domain found. Skip the entire URL
                if (empty($last_url)) {
                    continue;
                }

                // $last_url only contains domain. Need to add path and query if they exist.
                if (!empty($path)) {
                    // last_url was not added. Add it to urls here.
                    $last_url['url'] = preg_replace('/' . preg_quote($domain, '/') . '/u', $last_url['url'], $url);
                    $last_url['indices'][1] = $end_position;
                }
            } else {
                // In the case of t.co URLs, don't allow additional path characters
                if (preg_match(Regex::getValidTcoUrlMatcher(), $url, $tcoUrlMatches)) {
                    list($url, $tcoUrlSlug) = $tcoUrlMatches;
                    $end_position = $start_position + StringUtils::strlen($url);

                    // In the case of t.co URLs, don't allow additional path characters and
                    // ensure that the slug is under 40 chars.
                    if (strlen($tcoUrlSlug) > static::MAX_TCO_SLUG_LENGTH) {
                        continue;
                    }
                }
                if ($this->isValidHostAndLength(StringUtils::strlen($url), $protocol, $domain)) {
                    $urls[] = array(
                        'url' => $url,
                        'indices' => array($start_position, $end_position),
                    );
                }
            }
        }

        return $urls;
    }

    /**
     * Verifies that the host name adheres to RFC 3490 and 1035
     * Also, verifies that the entire url (including protocol) doesn't exceed MAX_URL_LENGTH
     *
     * @param int $originalUrlLength The length of the entire URL, including protocol if any
     * @param string $protocol The protocol used
     * @param string $host The hostname to check validity of
     * @return bool true if the host is valid
     */
    public function isValidHostAndLength($originalUrlLength, $protocol, $host)
    {
        if (empty($host)) {
            return false;
        }

        $originalHostLength = StringUtils::strlen($host);

        // Use IDN for all host names, if the host is all ASCII, it returns unchanged.
        // It comes with an added benefit of checking the host length to be between 1 to 63 characters.
        $encodedHost = StringUtils::idnToAscii($host);
        if ($encodedHost === false || empty($encodedHost)) {
            return false;
        }

        $punycodeEncodedHostLength = StringUtils::strlen($encodedHost);
        if ($punycodeEncodedHostLength === 0) {
            return false;
        }

        // The punycodeEncoded host length might be different now, offset that length from the URL.
        $encodedUrlLength = $originalUrlLength + $punycodeEncodedHostLength - $originalHostLength;
        // Add the protocol to our length check, if there isn't one, to ensure it doesn't go over the limit.
        $urlLengthWithProtocol = $encodedUrlLength + (empty($protocol) ? self::URL_GROUP_PROTOCOL_LENGTH : 0);

        return $urlLengthWithProtocol <= self::MAX_URL_LENGTH;
    }

    /**
     * Extracts all the usernames and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The username elements in the tweet.
     */
    public function extractMentionedScreennamesWithIndices($tweet)
    {
        $usernamesOnly = array();
        $mentions = $this->extractMentionsOrListsWithIndices($tweet);
        foreach ($mentions as $mention) {
            if (isset($mention['list_slug'])) {
                unset($mention['list_slug']);
            }
            $usernamesOnly[] = $mention;
        }
        return $usernamesOnly;
    }

    /**
     * Extracts all the usernames and the indices they occur at from the tweet.
     *
     * @param string  $tweet  The tweet to extract.
     * @return array  The username elements in the tweet.
     */
    public function extractMentionsOrListsWithIndices($tweet)
    {
        if (!preg_match('/[@＠]/u', $tweet)) {
            return array();
        }

        preg_match_all(Regex::getValidMentionsOrListsMatcher(), $tweet, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
        $results = array();

        foreach ($matches as $match) {
            list($all, $before, $at, $username, $list_slug, $outer) = array_pad($match, 6, array('', 0));
            $start_position = $at[1] > 0 ? StringUtils::strlen(substr($tweet, 0, $at[1])) : $at[1];
            $end_position = $start_position + StringUtils::strlen($at[0]) + StringUtils::strlen($username[0]);
            $entity = array(
                'screen_name' => $username[0],
                'list_slug' => $list_slug[0],
                'indices' => array($start_position, $end_position),
            );

            if (preg_match(Regex::getEndMentionMatcher(), $outer[0])) {
                continue;
            }

            if (!empty($list_slug[0])) {
                $entity['indices'][1] = $end_position + StringUtils::strlen($list_slug[0]);
            }

            $results[] = $entity;
        }

        return $results;
    }

    /**
     * setter/getter for extractURLWithoutProtocol
     *
     * @param boolean $flag
     * @return bool|Extractor
     */
    public function extractURLWithoutProtocol($flag = null)
    {
        if ($flag === null) {
            return $this->extractURLWithoutProtocol;
        }
        $this->extractURLWithoutProtocol = (bool) $flag;
        return $this;
    }

    /**
     * Remove overlapping entities.
     * This returns a new array with no overlapping entities.
     *
     * @param array $entities
     * @return array
     */
    public function removeOverlappingEntities($entities)
    {
        $result = array();
        usort($entities, array($this, 'sortEntities'));

        $prev = null;
        foreach ($entities as $entity) {
            if ($prev !== null && $entity['indices'][0] < $prev['indices'][1]) {
                continue;
            }
            $prev = $entity;
            $result[] = $entity;
        }
        return $result;
    }

    /**
     * sort by entity start index
     *
     * @param array $a
     * @param array $b
     * @return int
     */
    protected function sortEntities($a, $b)
    {
        if ($a['indices'][0] === $b['indices'][0]) {
            return 0;
        }
        return ($a['indices'][0] < $b['indices'][0]) ? -1 : 1;
    }
}
