<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class QrGenerator
{
    private const QRCODE_DIR = __DIR__ . '/../../public/assets/qrcodes';

    public static function generate(string $healthId): string
    {
        if (!is_dir(self::QRCODE_DIR)) {
            if (!mkdir(self::QRCODE_DIR, 0755, true) && !is_dir(self::QRCODE_DIR)) {
                throw new \RuntimeException('Failed to create QR code directory: ' . self::QRCODE_DIR);
            }
        }

        $filename = $healthId . '.png';
        $filePath = self::QRCODE_DIR . '/' . $filename;

        $qrCode = new QrCode($healthId);
        $writer = new PngWriter();
        $result = $writer->write($qrCode);
        $result->saveToFile($filePath);

        return '/assets/qrcodes/' . $filename;
    }
}
