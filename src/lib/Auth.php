<?php

require_once __DIR__ . '/../config/db.php';

class Auth
{
    public static function hashPin(string $pin): string
    {
        return password_hash($pin, PASSWORD_BCRYPT);
    }

    public static function verifyPin(string $pin, string $hash): bool
    {
        return password_verify($pin, $hash);
    }

    public static function attemptLogin(string $identifier, string $pin): ?string
    {
        $db = Database::getConnection();

        $stmt = $db->prepare(
            "SELECT id, pin_hash, failed_attempts, locked_until
             FROM users
             WHERE (health_id = ? OR phone = ?) AND is_deleted = 0
             LIMIT 1"
        );
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            return null;
        }

        if ($user['locked_until'] !== null) {
            $lockedUntil = strtotime($user['locked_until']);
            if ($lockedUntil > time()) {
                return null;
            }
        }

        if (!self::verifyPin($pin, $user['pin_hash'])) {
            $newAttempts = (int) $user['failed_attempts'] + 1;

            if ($newAttempts >= 5) {
                $update = $db->prepare(
                    "UPDATE users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?"
                );
                $update->execute([$newAttempts, $user['id']]);
            } else {
                $update = $db->prepare("UPDATE users SET failed_attempts = ? WHERE id = ?");
                $update->execute([$newAttempts, $user['id']]);
            }

            return null;
        }

        $db->prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?")
           ->execute([$user['id']]);

        $token = bin2hex(random_bytes(32));

        $insert = $db->prepare(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))"
        );
        $insert->execute([$user['id'], $token]);

        return $token;
    }

    public static function validateSession(string $token): int|false
    {
        $db = Database::getConnection();

        $stmt = $db->prepare(
            "SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1"
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        return $row ? (int) $row['user_id'] : false;
    }

    public static function logout(string $token): void
    {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM sessions WHERE token = ?");
        $stmt->execute([$token]);
    }
}
