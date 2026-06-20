<?php

require_once __DIR__ . '/../config/env.php';

class Encryption
{
    private const CIPHER = 'aes-256-cbc';

    public static function encrypt(string $plaintext): string
    {
        $key = self::getKey();
        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        $iv = openssl_random_pseudo_bytes($ivLength);

        $ciphertext = openssl_encrypt($plaintext, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);

        if ($ciphertext === false) {
            throw new \RuntimeException('Encryption failed: ' . openssl_error_string());
        }

        return base64_encode($iv . $ciphertext);
    }

    public static function decrypt(string $ciphertext): string
    {
        $key = self::getKey();
        $data = base64_decode($ciphertext, true);

        if ($data === false) {
            throw new \RuntimeException('Decryption failed: invalid base64 input.');
        }

        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        $iv = substr($data, 0, $ivLength);
        $encrypted = substr($data, $ivLength);

        $plaintext = openssl_decrypt($encrypted, self::CIPHER, $key, OPENSSL_RAW_DATA, $iv);

        if ($plaintext === false) {
            throw new \RuntimeException('Decryption failed: ' . openssl_error_string());
        }

        return $plaintext;
    }

    private static function getKey(): string
    {
        $key = env('ENCRYPTION_KEY');

        if ($key === null || $key === '') {
            throw new \RuntimeException(
                'ENCRYPTION_KEY is not set in environment. ' .
                'Generate one with: php -r "echo bin2hex(random_bytes(16));"'
            );
        }

        return hex2bin($key);
    }
}
