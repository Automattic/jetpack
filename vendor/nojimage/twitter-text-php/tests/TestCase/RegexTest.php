<?php

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Twitter\Text\Regex;

/**
 * test for Regex
 */
class RegexTest extends TestCase
{

    /**
     * @covers \Twitter\Text\Regex::getInvalidCharactersMatcher
     */
    public function testGetInvalidCharactersMatcher()
    {
        $matcher = Regex::getInvalidCharactersMatcher();
        $this->assertStringStartsWith('/[', $matcher);
        $this->assertStringEndsWith(']/u', $matcher);

        $matcherCached = Regex::getInvalidCharactersMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getRtlCharsMatcher
     */
    public function testGetRtlCharsMatcher()
    {
        $matcher = Regex::getRtlCharsMatcher();
        $this->assertStringStartsWith('/[', $matcher);
        $this->assertStringEndsWith(']/iu', $matcher);

        $matcherCached = Regex::getRtlCharsMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidMentionsOrListsMatcher
     */
    public function testGetValidMentionsOrListsMatcher()
    {
        $matcher = Regex::getValidMentionsOrListsMatcher();
        $this->assertStringStartsWith('/([', $matcher);
        $this->assertStringEndsWith('(?=(.*|$))/iu', $matcher);

        $matcherCached = Regex::getValidMentionsOrListsMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidReplyMatcher
     */
    public function testGetValidReplyMatcher()
    {
        $matcher = Regex::getValidReplyMatcher();
        $this->assertStringStartsWith('/^(?:[', $matcher);
        $this->assertStringEndsWith('(?=(.*|$))/iu', $matcher);

        $matcherCached = Regex::getValidReplyMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getEndMentionMatcher
     */
    public function testGetEndMentionMatcher()
    {
        $matcher = Regex::getEndMentionMatcher();
        $this->assertStringStartsWith('/\A(?:', $matcher);
        $this->assertStringEndsWith(')/iu', $matcher);

        $matcherCached = Regex::getEndMentionMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidHashtagMatcher
     */
    public function testGetValidHashtagMatcher()
    {
        $matcher = Regex::getValidHashtagMatcher();
        $this->assertStringStartsWith('/((?:', $matcher);
        $this->assertStringEndsWith('))/iu', $matcher);

        $matcherCached = Regex::getValidHashtagMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getEndHashtagMatcher
     */
    public function testGetEndHashtagMatcher()
    {
        $matcher = Regex::getEndHashtagMatcher();
        $this->assertStringStartsWith('/\A(?:', $matcher);
        $this->assertStringEndsWith(')/u', $matcher);

        $matcherCached = Regex::getEndHashtagMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidCashtagMatcher
     */
    public function testGetValidCashtagMatcher()
    {
        $matcher = Regex::getValidCashtagMatcher();
        $this->assertStringStartsWith('/(^|[', $matcher);
        $this->assertStringEndsWith(']))/iu', $matcher);

        $matcherCached = Regex::getValidCashtagMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getEndCashtagMatcher
     */
    public function testGetEndCashtagMatcher()
    {
        $matcher = Regex::getEndCashtagMatcher();
        $this->assertStringStartsWith('/\A(?:', $matcher);
        $this->assertStringEndsWith(')/u', $matcher);

        $matcherCached = Regex::getEndCashtagMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlUnencodedMatcher
     */
    public function testGetValidateUrlUnencodedMatcher()
    {
        $matcher = Regex::getValidateUrlUnencodedMatcher();
        $this->assertStringStartsWith('/\A(?:', $matcher);
        $this->assertStringEndsWith(')?\z/iux', $matcher);

        $matcherCached = Regex::getValidateUrlUnencodedMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlUnicodeAuthorityMatcher
     */
    public function testGetValidateUrlUnicodeAuthorityMatcher()
    {
        $matcher = Regex::getValidateUrlUnicodeAuthorityMatcher();
        $this->assertStringStartsWith('/(?:', $matcher);
        $this->assertStringEndsWith(')?/iux', $matcher);

        $matcherCached = Regex::getValidateUrlUnicodeAuthorityMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlAuthorityMatcher
     */
    public function testGetValidateUrlAuthorityMatcher()
    {
        $matcher = Regex::getValidateUrlAuthorityMatcher();
        $this->assertStringStartsWith('/(?:', $matcher);
        $this->assertStringEndsWith(')?/ix', $matcher);

        $matcherCached = Regex::getValidateUrlAuthorityMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlSchemeMatcher
     */
    public function testGetValidateUrlSchemeMatcher()
    {
        $matcher = Regex::getValidateUrlSchemeMatcher();
        $this->assertSame('/(?:[a-z][a-z0-9+\-.]*)/i', $matcher);

        $matcherCached = Regex::getValidateUrlSchemeMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlPathMatcher
     */
    public function testGetValidateUrlPathMatcher()
    {
        $matcher = Regex::getValidateUrlPathMatcher();
        $this->assertStringStartsWith('/(', $matcher);
        $this->assertStringEndsWith(')*/iu', $matcher);

        $matcherCached = Regex::getValidateUrlPathMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlQueryMatcher
     */
    public function testGetValidateUrlQueryMatcher()
    {
        $matcher = Regex::getValidateUrlQueryMatcher();
        $this->assertStringStartsWith('/(', $matcher);
        $this->assertStringEndsWith(')*/iu', $matcher);

        $matcherCached = Regex::getValidateUrlQueryMatcher();
        $this->assertSame($matcher, $matcherCached);
    }

    /**
     * @covers \Twitter\Text\Regex::getValidateUrlFragmentMatcher
     */
    public function testGetValidateUrlFragmentMatcher()
    {
        $matcher = Regex::getValidateUrlFragmentMatcher();
        $this->assertStringStartsWith('/(', $matcher);
        $this->assertStringEndsWith(')*/iu', $matcher);

        $matcherCached = Regex::getValidateUrlFragmentMatcher();
        $this->assertSame($matcher, $matcherCached);
    }
}
