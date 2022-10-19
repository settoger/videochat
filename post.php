<?php
session_start();
if(isset($_SESSION['name'])){
    $text = $_POST['text'];
    $text_message = '<div class="message"><span>'.$_SESSION['name'].': '.stripslashes(htmlspecialchars($text)).'</span></div>';
    file_put_contents("log.html", $text_message, FILE_APPEND | LOCK_EX);
}
?>