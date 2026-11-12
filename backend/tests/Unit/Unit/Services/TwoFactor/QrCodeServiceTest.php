<?php

namespace Tests\Unit\Services\TwoFactor;

use App\Services\TwoFactor\QrCodeService;
use Tests\TestCase;

class QrCodeServiceTest extends TestCase
{
    public function test_it_generates_an_svg_qr_code_data_uri(): void
    {
        $service = new QrCodeService;

        $dataUri = $service->generateDataUri(
            'otpauth://totp/TwoFactorAuth:test@example.com?secret=ABC123&issuer=TwoFactorAuth',
        );

        $this->assertStringStartsWith(
            'data:image/svg+xml;base64,',
            $dataUri,
        );

        $svg = base64_decode(
            substr($dataUri, strlen('data:image/svg+xml;base64,')),
            true,
        );

        $this->assertNotFalse($svg);
        $this->assertStringContainsString('<svg', $svg);
    }
}
