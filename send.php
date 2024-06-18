<?php

// Проверяем если капча была введена 
if (!isset($_POST['captcha'])) {
    echo '1';
    exit();
}
    
$code = $_POST['captcha']; // Получаем переданную капчу. 
session_start(); 

$name = isset($_POST['name']) ? $_POST['name'] : '';
$email = isset($_POST['email']) ? $_POST['email'] : '';
$message = isset($_POST['message']) ? $_POST['message'] : '';

$text = 'Имя: ' . $name . "\r\n" . 'Email: ' . $email . "\r\n\r\n" . $message;
 
// Сравниваем введенную капчу с сохраненной в переменной в сессии 
if (!isset($_SESSION['capcha']) || strtoupper($_SESSION['capcha']) != strtoupper($code)) {
    echo '2';
    exit();
}

if (!utf8mail("info@batysgs.kz", "Обратная связь", $text, $name, 'webmaster@batysgs.kz')) {
    echo '3';
    exit();
}

unset($_SESSION['capcha']);

function utf8mail($to, $s, $body, $from_name, $from_a, $reply)
{
    $s= "=?utf-8?b?".base64_encode($s)."?=";
    $headers = "MIME-Version: 1.0\r\n";
    $headers.= "From: =?utf-8?b?".base64_encode($from_name)."?= <".$from_a.">\r\n";
    $headers.= "Content-Type: text/plain;charset=utf-8\r\n";
    //$headers.= "Reply-To: $reply\r\n";  
    $headers.= "X-Mailer: PHP/" . phpversion();
    return mail($to, $s, $body, $headers);
}

?>