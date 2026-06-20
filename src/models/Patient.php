<?php

require_once __DIR__ . '/../config/db.php';

class Patient
{
    private const TABLE = 'patients';
    private const ALLOWED_COLUMNS = [
        'id', 'health_id', 'name', 'avatar_initials', 'verified',
        'created_by', 'created_at', 'updated_at',
    ];

    public static function find(int $id): ?array
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "SELECT * FROM " . self::TABLE . " WHERE id = ? AND is_deleted = 0 LIMIT 1"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findBy(array $criteria): array
    {
        $db = Database::getConnection();
        $sql = "SELECT * FROM " . self::TABLE . " WHERE is_deleted = 0";
        $params = [];

        foreach ($criteria as $column => $value) {
            if (!in_array($column, self::ALLOWED_COLUMNS, true)) {
                throw new \InvalidArgumentException("Invalid column: $column");
            }
            $sql .= " AND $column = ?";
            $params[] = $value;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function create(array $data): int
    {
        $db = Database::getConnection();

        $columns = [];
        $placeholders = [];
        $params = [];

        foreach ($data as $column => $value) {
            if (!in_array($column, self::ALLOWED_COLUMNS, true)) {
                throw new \InvalidArgumentException("Invalid column: $column");
            }
            $columns[] = $column;
            $placeholders[] = '?';
            $params[] = $value;
        }

        $sql = "INSERT INTO " . self::TABLE . " (" . implode(', ', $columns) . ")
                VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return (int) $db->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $db = Database::getConnection();

        $sets = [];
        $params = [];

        foreach ($data as $column => $value) {
            if (!in_array($column, self::ALLOWED_COLUMNS, true)) {
                throw new \InvalidArgumentException("Invalid column: $column");
            }
            $sets[] = "$column = ?";
            $params[] = $value;
        }

        if (empty($sets)) {
            return false;
        }

        $params[] = $id;
        $sql = "UPDATE " . self::TABLE . " SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    public static function softDelete(int $id): bool
    {
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE " . self::TABLE . " SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0"
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
