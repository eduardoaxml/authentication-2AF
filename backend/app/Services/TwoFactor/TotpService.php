<?php

namespace App\Services\TwoFactor;

use OTPHP\InternalClock;
use OTPHP\TOTP;

class TotpService
{
    private const SECRET_SIZE = 20;

    private const VERIFICATION_WINDOW = 1;

    public function generateSecret(): string
    {
        return TOTP::generate(
            new InternalClock(),
            self::SECRET_SIZE,
        )->getSecret();
    }

    public function getProvisioningUri(
        string $secret,
        string $email,
    ): string {
        return TOTP::createFromSecret(
            $secret,
            new InternalClock(),
        )
            ->withLabel($email)
            ->withIssuer(config('app.name'))
            ->getProvisioningUri();
    }

    public function verifyCode(
        string $secret,
        string $code,
    ): bool {
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        return TOTP::createFromSecret(
            $secret,
            new InternalClock(),
        )->verify($code, null, self::VERIFICATION_WINDOW);
    }
}
