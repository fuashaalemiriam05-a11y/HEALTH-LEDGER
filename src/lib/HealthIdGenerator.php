<?php

class HealthIdGenerator
{
    private const PREFIX = 'HC';
    private const MAX_ATTEMPTS = 10;

    public static function generate(PDO $db): string
    {
        $year = date('Y');
        $prefix = self::PREFIX . '-' . $year . '-';
        $prefixLen = strlen($prefix);

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $stmt = $db->prepare(
                "SELECT MAX(CAST(SUBSTRING(health_id, ? + 1) AS UNSIGNED))
                 FROM patients
                 WHERE health_id LIKE ?"
            );
            $stmt->execute([$prefixLen, $prefix . '%']);
            $maxSeq = (int) $stmt->fetchColumn();
            $nextSeq = $maxSeq + 1;
            $healthId = $prefix . str_pad((string) $nextSeq, 5, '0', STR_PAD_LEFT);

            $check = $db->prepare("SELECT 1 FROM patients WHERE health_id = ?");
            $check->execute([$healthId]);
            if (!$check->fetchColumn()) {
                return $healthId;
            }

            usleep(10000);
        }

        throw new \RuntimeException(
            'Failed to generate a unique health ID after ' . self::MAX_ATTEMPTS . ' attempts.'
        );
    }
}
