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
            new InternalClock,
            self::SECRET_SIZE,
        )->getSecret();
    }

    public function getProvisioningUri(
        string $secret,
        string $email,
    ): string {
        return TOTP::createFromSecret(
            $secret,
            new InternalClock,
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
            new InternalClock,
        )->verify($code, null, self::VERIFICATION_WINDOW);
    }

    public function getMatchingTimeStep(
        string $secret,
        string $code,
    ): ?int {
        if (! preg_match('/^\d{6}$/', $code)) {
            return null;
        }

        $totp = TOTP::createFromSecret(
            $secret,
            new InternalClock,
        );

        $period = $totp->getPeriod();
        $currentTimeStep = intdiv(time(), $period);

        for (
            $timeStep = $currentTimeStep - self::VERIFICATION_WINDOW;
            $timeStep <= $currentTimeStep + self::VERIFICATION_WINDOW;
            $timeStep++
        ) {
            if ($totp->verify($code, $timeStep * $period, 0)) {
                return $timeStep;
            }
        }

        return null;
    }
}
