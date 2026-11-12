<?php

namespace App\Services\TwoFactor;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\SvgWriter;

class QrCodeService
{
    private const SIZE = 300;

    private const MARGIN = 10;

    public function generateDataUri(string $data): string
    {
        $result = (new Builder(
            writer: new SvgWriter,
            data: $data,
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: self::SIZE,
            margin: self::MARGIN,
        ))->build();

        return $result->getDataUri();
    }
}
