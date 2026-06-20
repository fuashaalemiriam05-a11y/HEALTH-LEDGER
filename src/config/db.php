<?php

require_once __DIR__ . '/env.php';

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = env('DB_HOST', 'localhost');
            $name = env('DB_NAME', 'health-ledger');
            $user = env('DB_USER', 'root');
            $pass = env('DB_PASS', '');

            $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }

        return self::$instance;
    }
}
