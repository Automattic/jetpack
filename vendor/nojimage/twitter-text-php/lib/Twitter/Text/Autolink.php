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
 * Twitter Autolink Class
 *
 * Parses tweets and generates HTML anchor tags around URLs, usernames,
 * username/list pairs and hashtags.
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
class Autolink
{

    /**
     * CSS class for auto-linked URLs.
     *
     * @var string
     */
    protected $class_url = '';

    /**
     * CSS class for auto-linked username URLs.
     *
     * @var string
     */
    protected $class_user = 'tweet-url username';

    /**
     * CSS class for auto-linked list URLs.
     *
     * @var string
     */
    protected $class_list = 'tweet-url list-slug';

    /**
     * CSS class for auto-linked hashtag URLs.
     *
     * @var string
     */
    protected $class_hash = 'tweet-url hashtag';

    /**
     * CSS class for auto-linked cashtag URLs.
     *
     * @var string
     */
    protected $class_cash = 'tweet-url cashtag';

    /**
     * URL base for username links (the username without the @ will be appended).
     *
     * @var string
     */
    protected $url_base_user = 'https://twitter.com/';

    /**
     * URL base for list links (the username/list without the @ will be appended).
     *
     * @var string
     */
    protected $url_base_list = 'https://twitter.com/';

    /**
     * URL base for hashtag links (the hashtag without the # will be appended).
     *
     * @var string
     */
    protected $url_base_hash = 'https://twitter.com/search?q=%23';

    /**
     * URL base for cashtag links (the hashtag without the $ will be appended).
     *
     * @var string
     */
    protected $url_base_cash = 'https://twitter.com/search?q=%24';

    /**
     * the 'rel' attribute values.
     *
     * @var array
     */
    protected $rel = array('external', 'nofollow');

    /**
     * The scope to open the link in.
     *
     * Support for the 'target' attribute was deprecated in HTML 4.01 but has
     * since been reinstated in HTML 5.  To output the 'target' attribute you
     * must disable the adding of the string 'external' to the 'rel' attribute.
     *
     * @var string
     */
    protected $target = '_blank';

    /**
     * attribute for invisible span tag
     *
     * @var string
     */
    protected $invisibleTagAttrs = "style='position:absolute;left:-9999px;'";

    /**
     * If the at mark '@' should be included in the link (false by default)
     *
     * @var bool
     * @since 3.0.1
     */
    protected $usernameIncludeSymbol = false;

    /**
     * HTML tag to be applied around #/@/# symbols in hashtags/usernames/lists/cashtag
     *
     * @var string
     * @since 3.0.1
     */
    protected $symbolTag = '';

    /**
     * HTML tag to be applied around text part of hashtags/usernames/lists/cashtag
     *
     * @var string
     * @since 3.0.1
     */
    protected $textWithSymbolTag = '';

    /**
     *
     * @var Extractor
     */
    protected $extractor = null;

    /**
     * The tweet to be used in parsing.
     *
     * @var string
     * @deprecated will be removed
     */
    protected $tweet = '';

    /**
     * Provides fluent method chaining.
     *
     * @param string  $tweet        [deprecated] The tweet to be converted.
     * @param bool    $full_encode  [deprecated] Whether to encode all special characters.
     *
     * @see __construct()
     *
     * @return Autolink
     */
    public static function create($tweet = null, $full_encode = false)
    {
        return new static($tweet, $full_encode);
    }

    /**
     * Reads in a tweet to be parsed and converted to contain links.
     *
     * As the intent is to produce links and output the modified tweet to the
     * user, we take this opportunity to ensure that we escape user input.
     *
     * @see htmlspecialchars()
     *
     * @param string  $tweet        [deprecated] The tweet to be converted.
     * @param bool    $escape       [deprecated] Whether to escape the tweet (default: true).
     * @param bool    $full_encode  [deprecated] Whether to encode all special characters.
     */
    public function __construct($tweet = null, $escape = true, $full_encode = false)
    {
        if ($escape && !empty($tweet)) {
            if ($full_encode) {
                $this->tweet = htmlentities($tweet, ENT_QUOTES, 'UTF-8', false);
            } else {
                $this->tweet = htmlspecialchars($tweet, ENT_QUOTES, 'UTF-8', false);
            }
        } else {
            $this->tweet = $tweet;
        }

        $this->extractor = Extractor::create();
    }

    /**
     * Set CSS class to all link types.
     *
     * @param string $v CSS class for links.
     *
     * @return Autolink Fluid method chaining.
     */
    public function setToAllLinkClasses($v)
    {
        $this->setURLClass($v);
        $this->setUsernameClass($v);
        $this->setListClass($v);
        $this->setHashtagClass($v);
        $this->setCashtagClass($v);

        return $this;
    }

    /**
     * CSS class for auto-linked URLs.
     *
     * @return string  CSS class for URL links.
     */
    public function getURLClass()
    {
        return $this->class_url;
    }

    /**
     * CSS class for auto-linked URLs.
     *
     * @param string  $v  CSS class for URL links.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setURLClass($v)
    {
        $this->class_url = trim($v);
        return $this;
    }

    /**
     * CSS class for auto-linked username URLs.
     *
     * @return string  CSS class for username links.
     */
    public function getUsernameClass()
    {
        return $this->class_user;
    }

    /**
     * CSS class for auto-linked username URLs.
     *
     * @param string  $v  CSS class for username links.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setUsernameClass($v)
    {
        $this->class_user = trim($v);
        return $this;
    }

    /**
     * CSS class for auto-linked username/list URLs.
     *
     * @return string  CSS class for username/list links.
     */
    public function getListClass()
    {
        return $this->class_list;
    }

    /**
     * CSS class for auto-linked username/list URLs.
     *
     * @param string  $v  CSS class for username/list links.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setListClass($v)
    {
        $this->class_list = trim($v);
        return $this;
    }

    /**
     * CSS class for auto-linked hashtag URLs.
     *
     * @return string  CSS class for hashtag links.
     */
    public function getHashtagClass()
    {
        return $this->class_hash;
    }

    /**
     * CSS class for auto-linked hashtag URLs.
     *
     * @param string  $v  CSS class for hashtag links.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setHashtagClass($v)
    {
        $this->class_hash = trim($v);
        return $this;
    }

    /**
     * CSS class for auto-linked cashtag URLs.
     *
     * @return string  CSS class for cashtag links.
     */
    public function getCashtagClass()
    {
        return $this->class_cash;
    }

    /**
     * CSS class for auto-linked cashtag URLs.
     *
     * @param string  $v  CSS class for cashtag links.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setCashtagClass($v)
    {
        $this->class_cash = trim($v);
        return $this;
    }

    /**
     * Whether to include the value 'nofollow' in the 'rel' attribute.
     *
     * @return bool  Whether to add 'nofollow' to the 'rel' attribute.
     */
    public function getNoFollow()
    {
        return in_array('nofollow', $this->rel, true);
    }

    /**
     * Whether to include the value 'nofollow' in the 'rel' attribute.
     *
     * @param bool  $v  The value to add to the 'target' attribute.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setNoFollow($v)
    {
        if ($v && !$this->getNoFollow()) {
            $this->setRel('nofollow', true);
        }
        if (!$v && $this->getNoFollow()) {
            $this->rel = array_filter($this->rel, function ($r) {
                return $r !== 'nofollow';
            });
        }

        return $this;
    }

    /**
     * Whether to include the value 'external' in the 'rel' attribute.
     *
     * Often this is used to be matched on in JavaScript for dynamically adding
     * the 'target' attribute which is deprecated in HTML 4.01.  In HTML 5 it has
     * been undeprecated and thus the 'target' attribute can be used.  If this is
     * set to false then the 'target' attribute will be output.
     *
     * @return bool  Whether to add 'external' to the 'rel' attribute.
     */
    public function getExternal()
    {
        return in_array('external', $this->rel, true);
    }

    /**
     * Whether to include the value 'external' in the 'rel' attribute.
     *
     * Often this is used to be matched on in JavaScript for dynamically adding
     * the 'target' attribute which is deprecated in HTML 4.01.  In HTML 5 it has
     * been undeprecated and thus the 'target' attribute can be used.  If this is
     * set to false then the 'target' attribute will be output.
     *
     * @param bool  $v  The value to add to the 'target' attribute.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setExternal($v)
    {
        if ($v && !$this->getExternal()) {
            $this->setRel('external', true);
        }
        if (!$v && $this->getExternal()) {
            $this->rel = array_filter($this->rel, function ($r) {
                return $r !== 'external';
            });
        }

        return $this;
    }

    /**
     * The scope to open the link in.
     *
     * Support for the 'target' attribute was deprecated in HTML 4.01 but has
     * since been reinstated in HTML 5.  To output the 'target' attribute you
     * must disable the adding of the string 'external' to the 'rel' attribute.
     *
     * @return string  The value to add to the 'target' attribute.
     */
    public function getTarget()
    {
        return $this->target;
    }

    /**
     * The scope to open the link in.
     *
     * Support for the 'target' attribute was deprecated in HTML 4.01 but has
     * since been reinstated in HTML 5.  To output the 'target' attribute you
     * must disable the adding of the string 'external' to the 'rel' attribute.
     *
     * @param string  $v  The value to add to the 'target' attribute.
     *
     * @return Autolink  Fluid method chaining.
     */
    public function setTarget($v)
    {
        $this->target = trim($v);
        return $this;
    }

    /**
     * @return bool
     * @since 3.0.1
     */
    public function isUsernameIncludeSymbol()
    {
        return $this->usernameIncludeSymbol;
    }

    /**
     * Set if the at mark '@' should be included in the link (false by default)
     *
     * @param bool $usernameIncludeSymbol if username includes symbol
     * @return Autolink
     * @since 3.0.1
     */
    public function setUsernameIncludeSymbol($usernameIncludeSymbol)
    {
        $this->usernameIncludeSymbol = $usernameIncludeSymbol;

        return $this;
    }

    /**
     * @return string
     * @since 3.0.1
     */
    public function getSymbolTag()
    {
        return $this->symbolTag;
    }

    /**
     * Set HTML tag to be applied around #/@/# symbols in hashtags/usernames/lists/cashtag
     *
     * @param string $symbolTag HTML tag without bracket. e.g., 'b' or 's'
     * @return Autolink
     * @since 3.0.1
     */
    public function setSymbolTag($symbolTag)
    {
        $this->symbolTag = $symbolTag;

        return $this;
    }

    /**
     * @return string
     * @since 3.0.1
     */
    public function getTextWithSymbolTag()
    {
        return $this->textWithSymbolTag;
    }

    /**
     * Set HTML tag to be applied around text part of hashtags/usernames/lists/cashtag
     *
     * @param string $textWithSymbolTag HTML tag without bracket. e.g., 'b' or 's'
     * @return Autolink
     * @since 3.0.1
     */
    public function setTextWithSymbolTag($textWithSymbolTag)
    {
        $this->textWithSymbolTag = $textWithSymbolTag;

        return $this;
    }

    /**
     * Autolink with entities
     *
     * @param string $tweet
     * @param array $entities
     * @return string
     * @since 1.1.0
     */
    public function autoLinkEntities($tweet = null, $entities = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }

        $text = '';
        $beginIndex = 0;
        foreach ($entities as $entity) {
            $text .= StringUtils::substr($tweet, $beginIndex, $entity['indices'][0] - $beginIndex);

            if (isset($entity['url'])) {
                $text .= $this->linkToUrl($entity);
            } elseif (isset($entity['hashtag'])) {
                $text .= $this->linkToHashtag($entity, $tweet);
            } elseif (isset($entity['screen_name'])) {
                $text .= $this->linkToMentionAndList($entity, $tweet);
            } elseif (isset($entity['cashtag'])) {
                $text .= $this->linkToCashtag($entity, $tweet);
            }
            $beginIndex = $entity['indices'][1];
        }
        $text .= StringUtils::substr($tweet, $beginIndex, StringUtils::strlen($tweet));
        return $text;
    }

    /**
     * Auto-link hashtags, URLs, usernames and lists, with JSON entities.
     *
     * @param string The tweet to be converted
     * @param mixed  The entities info
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLinkWithJson($tweet = null, $json = null)
    {
        // concatenate entities
        $entities = array();
        if (is_object($json)) {
            $json = $this->object2array($json);
        }
        if (is_array($json)) {
            $entities = call_user_func_array('array_merge', $json);
        }

        // map JSON entity to twitter-text entity
        foreach ($entities as $idx => $entity) {
            if (!empty($entity['text'])) {
                $entities[$idx]['hashtag'] = $entity['text'];
            }
        }

        $entities = $this->extractor->removeOverlappingEntities($entities);
        return $this->autoLinkEntities($tweet, $entities);
    }

    /**
     * convert Object to Array
     *
     * @param mixed $obj
     * @return array
     */
    protected function object2array($obj)
    {
        $array = (array) $obj;
        foreach ($array as $key => $var) {
            if (is_object($var) || is_array($var)) {
                $array[$key] = $this->object2array($var);
            }
        }
        return $array;
    }

    /**
     * Auto-link hashtags, URLs, usernames and lists.
     *
     * @param string The tweet to be converted
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLink($tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $entities = $this->extractor->extractURLWithoutProtocol(false)->extractEntitiesWithIndices($tweet);
        return $this->autoLinkEntities($tweet, $entities);
    }

    /**
     * Auto-link the @username and @username/list references in the provided text. Links to @username references will
     * have the usernameClass CSS classes added. Links to @username/list references will have the listClass CSS class
     * added.
     *
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLinkUsernamesAndLists($tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $entities = $this->extractor->extractMentionsOrListsWithIndices($tweet);
        return $this->autoLinkEntities($tweet, $entities);
    }

    /**
     * Auto-link #hashtag references in the provided Tweet text. The #hashtag links will have the hashtagClass CSS class
     * added.
     *
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLinkHashtags($tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $entities = $this->extractor->extractHashtagsWithIndices($tweet);
        return $this->autoLinkEntities($tweet, $entities);
    }

    /**
     * Auto-link URLs in the Tweet text provided.
     * <p/>
     * This only auto-links URLs with protocol.
     *
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLinkURLs($tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $entities = $this->extractor->extractURLWithoutProtocol(false)->extractURLsWithIndices($tweet);
        return $this->autoLinkEntities($tweet, $entities);
    }

    /**
     * Auto-link $cashtag references in the provided Tweet text. The $cashtag links will have the cashtagClass CSS class
     * added.
     *
     * @return string that auto-link HTML added
     * @since 1.1.0
     */
    public function autoLinkCashtags($tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $entities = $this->extractor->extractCashtagsWithIndices($tweet);
        return $this->autoLinkEntities($tweet, $entities);
    }

    public function linkToUrl($entity)
    {
        if (!empty($this->class_url)) {
            $attributes['class'] = $this->class_url;
        }
        $attributes['href'] = $entity['url'];
        $linkText = $this->escapeHTML($entity['url']);

        if (!empty($entity['display_url']) && !empty($entity['expanded_url'])) {
            // Goal: If a user copies and pastes a tweet containing t.co'ed link, the resulting paste
            // should contain the full original URL (expanded_url), not the display URL.
            //
            // Method: Whenever possible, we actually emit HTML that contains expanded_url, and use
            // font-size:0 to hide those parts that should not be displayed (because they are not part of display_url).
            // Elements with font-size:0 get copied even though they are not visible.
            // Note that display:none doesn't work here. Elements with display:none don't get copied.
            //
            // Additionally, we want to *display* ellipses, but we don't want them copied.  To make this happen we
            // wrap the ellipses in a tco-ellipsis class and provide an onCopy handler that sets display:none on
            // everything with the tco-ellipsis class.
            //
            // As an example: The user tweets "hi http://longdomainname.com/foo"
            // This gets shortened to "hi http://t.co/xyzabc", with display_url = "…nname.com/foo"
            // This will get rendered as:
            // <span class='tco-ellipsis'> <!-- This stuff should get displayed but not copied -->
            //   …
            //   <!-- There's a chance the onCopy event handler might not fire. In case that happens,
            //        we include an &nbsp; here so that the … doesn't bump up against the URL and ruin it.
            //        The &nbsp; is inside the tco-ellipsis span so that when the onCopy handler *does*
            //        fire, it doesn't get copied.  Otherwise the copied text would have two spaces in a row,
            //        e.g. "hi  http://longdomainname.com/foo".
            //   <span style='font-size:0'>&nbsp;</span>
            // </span>
            // <span style='font-size:0'>  <!-- This stuff should get copied but not displayed -->
            //   http://longdomai
            // </span>
            // <span class='js-display-url'> <!-- This stuff should get displayed *and* copied -->
            //   nname.com/foo
            // </span>
            // <span class='tco-ellipsis'> <!-- This stuff should get displayed but not copied -->
            //   <span style='font-size:0'>&nbsp;</span>
            //   …
            // </span>
            //
            // Exception: pic.twitter.com images, for which
            // expandedUrl = "https://twitter.com/#!/username/status/1234/photo/1
            // For those URLs, display_url is not a substring of expanded_url, so we don't do anything
            //special to render the elided parts.
            // For a pic.twitter.com URL, the only elided part will be the "https://", so this is fine.
            $displayURL = $entity['display_url'];
            $expandedURL = $entity['expanded_url'];
            $displayURLSansEllipses = preg_replace('/…/u', '', $displayURL);
            $diplayURLIndexInExpandedURL = mb_strpos($expandedURL, $displayURLSansEllipses);

            if ($diplayURLIndexInExpandedURL !== false) {
                $beforeDisplayURL = mb_substr($expandedURL, 0, $diplayURLIndexInExpandedURL);
                $afterDisplayURL = mb_substr(
                    $expandedURL,
                    $diplayURLIndexInExpandedURL + mb_strlen($displayURLSansEllipses)
                );
                $precedingEllipsis = (preg_match('/\A…/u', $displayURL)) ? '…' : '';
                $followingEllipsis = (preg_match('/…\z/u', $displayURL)) ? '…' : '';

                $invisibleSpan = "<span {$this->invisibleTagAttrs}>";

                $linkText = "<span class='tco-ellipsis'>{$precedingEllipsis}{$invisibleSpan}&nbsp;</span></span>";
                $linkText .= "{$invisibleSpan}{$this->escapeHTML($beforeDisplayURL)}</span>";
                $linkText .= "<span class='js-display-url'>{$this->escapeHTML($displayURLSansEllipses)}</span>";
                $linkText .= "{$invisibleSpan}{$this->escapeHTML($afterDisplayURL)}</span>";
                $linkText .= "<span class='tco-ellipsis'>{$invisibleSpan}&nbsp;</span>{$followingEllipsis}</span>";
            } else {
                $linkText = $entity['display_url'];
            }
            $attributes['title'] = $entity['expanded_url'];
        } elseif (!empty($entity['display_url'])) {
            $linkText = $entity['display_url'];
        }

        return $this->linkToText($entity, $linkText, $attributes);
    }

    /**
     *
     * @param array  $entity
     * @param string $tweet
     * @return string
     * @since 1.1.0
     */
    public function linkToHashtag($entity, $tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }

        $attributes = array();
        $class = array();
        $hash = StringUtils::substr($tweet, $entity['indices'][0], 1);
        $linkText = $entity['hashtag'];

        $attributes['href'] = $this->url_base_hash . $entity['hashtag'];
        $attributes['title'] = '#' . $entity['hashtag'];
        if (!empty($this->class_hash)) {
            $class[] = $this->class_hash;
        }
        if (preg_match(Regex::getRtlCharsMatcher(), $linkText)) {
            $class[] = 'rtl';
        }
        if (!empty($class)) {
            $attributes['class'] = implode(' ', $class);
        }

        return $this->linkToTextWithSymbol($entity, $hash, $linkText, $attributes);
    }

    /**
     *
     * @param array  $entity
     * @param string $tweet
     * @return string
     * @since 1.1.0
     */
    public function linkToMentionAndList($entity, $tweet)
    {
        $attributes = array();
        $symbol = StringUtils::substr($tweet, $entity['indices'][0], 1);

        if (!empty($entity['list_slug'])) {
            # Replace the list and username
            $linkText = $entity['screen_name'] . $entity['list_slug'];
            $class = $this->class_list;
            $url = $this->url_base_list . $linkText;
        } else {
            # Replace the username
            $linkText = $entity['screen_name'];
            $class = $this->class_user;
            $url = $this->url_base_user . $linkText;
        }
        if (!empty($class)) {
            $attributes['class'] = $class;
        }
        $attributes['href'] = $url;

        return $this->linkToTextWithSymbol($entity, $symbol, $linkText, $attributes);
    }

    /**
     *
     * @param array  $entity
     * @param string $tweet
     * @return string
     * @since 1.1.0
     */
    public function linkToCashtag($entity, $tweet = null)
    {
        if ($tweet === null) {
            $tweet = $this->tweet;
        }
        $attributes = array();
        $dollar = StringUtils::substr($tweet, $entity['indices'][0], 1);
        $linkText = $entity['cashtag'];
        $attributes['href'] = $this->url_base_cash . $entity['cashtag'];
        $attributes['title'] = '$' . $linkText;
        if (!empty($this->class_cash)) {
            $attributes['class'] = $this->class_cash;
        }

        return $this->linkToTextWithSymbol($entity, $dollar, $linkText, $attributes);
    }

    /**
     *
     * @param array $entity
     * @param string $text
     * @param array $attributes
     * @return string
     * @since 1.1.0
     */
    public function linkToText(array $entity, $text, $attributes = array())
    {
        $rel = $this->getRel();
        if ($rel !== '') {
            $attributes['rel'] = $rel;
        }
        if ($this->target) {
            $attributes['target'] = $this->target;
        }
        $link = '<a';
        foreach ($attributes as $key => $val) {
            $link .= ' ' . $key . '="' . $this->escapeHTML($val) . '"';
        }
        $link .= '>' . $text . '</a>';
        return $link;
    }

    /**
     *
     * @param array $entity
     * @param string $symbol
     * @param string $linkText
     * @param array $attributes
     * @return string
     * @since 3.0.1
     */
    protected function linkToTextWithSymbol(array $entity, $symbol, $linkText, array $attributes)
    {
        $includeSymbol = $this->usernameIncludeSymbol || !preg_match('/[@＠]/u', $symbol);

        if (!empty($this->symbolTag)) {
            $symbol = sprintf('<%1$s>%2$s</%1$s>', $this->symbolTag, $symbol);
        }
        if (!empty($this->textWithSymbolTag)) {
            $linkText = sprintf('<%1$s>%2$s</%1$s>', $this->textWithSymbolTag, $linkText);
        }

        if (!$includeSymbol) {
            return $symbol . $this->linkToText($entity, $linkText, $attributes);
        }

        $linkText = $symbol . $linkText;

        return $this->linkToText($entity, $linkText, $attributes);
    }

    /**
     * get rel attribute
     *
     * @return string
     */
    public function getRel()
    {
        $rel = $this->rel;
        $rel = array_unique($rel);

        return implode(' ', $rel);
    }

    /**
     * Set rel attribute.
     *
     * This method override setExternal/setNoFollow setting.
     *
     * @param string[]|string $rel the rel attribute
     * @param bool $merge if true, merge rel attributes instead replace.
     * @return $this
     */
    public function setRel($rel, $merge = false)
    {
        if (is_string($rel)) {
            $rel = explode(' ', $rel);
        }

        $this->rel = $merge ? array_unique(array_merge($this->rel, $rel)) : $rel;

        return $this;
    }

    /**
     * html escape
     *
     * @param string $text
     * @return string
     */
    protected function escapeHTML($text)
    {
        return htmlspecialchars($text, ENT_QUOTES, 'UTF-8', false);
    }
}
