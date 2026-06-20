<?php

require_once __DIR__ . '/../config/db.php';

class AuditLogger
{
    public static function logView(
        int $userId,
        ?int $patientId,
        ?int $recordId,
        string $action
    ): void {
        $db = Database::getConnection();

        $stmt = $db->prepare(
            "INSERT INTO audit_logs (user_id, patient_id, record_id, action, ip_address, device_info)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            $patientId,
            $recordId,
            $action,
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    }
}
