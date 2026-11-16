<?php
/**
 * DEC Crane – iletişim formu işleyici
 * PHP destekli herhangi bir hostingde çalışır. Alıcı adresini aşağıdan değiştirin.
 */
header('Content-Type: application/json; charset=utf-8');

$TO      = 'info@deccrane.com';          // Formun gideceği adres
$FROM    = 'no-reply@deccrane.com';      // Kendi alan adınızdan bir adres olmalı
$SUBJECT = 'DEC Crane – Web Site Contact Form';

function out($ok, $msg, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'Method not allowed', 405);

// Bot tuzağı (gizli alan doluysa sessizce başarılı dön)
if (!empty($_POST['website'])) out(true, 'Thank you!');

$clean = fn($v) => trim(str_replace(["\r", "\n"], ' ', strip_tags($v ?? '')));
$name    = $clean($_POST['name'] ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$phone   = $clean($_POST['number'] ?? '');
$subject = $clean($_POST['subject'] ?? '');
$message = trim(strip_tags($_POST['message'] ?? ''));

if ($name === '' || !$email || $message === '') out(false, 'Please fill in all required fields.', 422);
if (mb_strlen($message) > 5000) out(false, 'Message is too long.', 422);

$body  = "Name: $name\nEmail: $email\nPhone: $phone\nSubject: $subject\n\nMessage:\n$message\n";
$headers  = "From: DEC Crane Web <$FROM>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$ok = @mail($TO, '=?UTF-8?B?' . base64_encode($SUBJECT . ($subject ? " – $subject" : '')) . '?=', $body, $headers);
$ok ? out(true, 'Your message has been sent. Thank you!') : out(false, 'Mail could not be sent.', 500);
