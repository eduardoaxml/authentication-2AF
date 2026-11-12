<?php

namespace Tests\Unit\Services\TwoFactor;

use App\Services\TwoFactor\TotpService;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

class TotpServiceTest extends TestCase
{
    private TotpService $totpService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->totpService = new TotpService();
    }

    public function test_it_generates_a_valid_base32_secret(): void
    {
        $secret = $this->totpService->generateSecret();

        $this->assertMatchesRegularExpression(
            '/^[A-Z2-7]+$/',
            $secret,
        );

        $this->assertSame(32, strlen($secret));
    }

    public function test_it_generates_a_valid_provisioning_uri(): void
    {
        $secret = $this->totpService->generateSecret();

        $uri = $this->totpService->getProvisioningUri(
            $secret,
            'test@example.com',
        );

        $this->assertStringStartsWith('otpauth://totp/', $uri);
        $this->assertStringContainsString('secret='.$secret, $uri);
        $this->assertStringContainsString(
            'issuer='.rawurlencode(config('app.name')),
            $uri,
        );
    }

    public function test_it_verifies_a_valid_totp_code(): void
    {
        $secret = $this->totpService->generateSecret();

        $totp = TOTP::createFromSecret(
            $secret,
            new InternalClock(),
        );

        $this->assertTrue(
            $this->totpService->verifyCode(
                $secret,
                $totp->now(),
            ),
        );
    }

    public function test_it_rejects_an_invalid_totp_code(): void
    {
        $secret = $this->totpService->generateSecret();

        $this->assertFalse(
            $this->totpService->verifyCode($secret, 'invalid'),
        );
    }

    public function test_it_rejects_codes_with_incorrect_length(): void
    {
        $secret = $this->totpService->generateSecret();

        $this->assertFalse(
            $this->totpService->verifyCode($secret, '12345'),
        );

        $this->assertFalse(
            $this->totpService->verifyCode($secret, '1234567'),
        );
    }
}
