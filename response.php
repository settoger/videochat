<?php
session_start();
if($_POST["message"] == "stop") {
    $logout_message ='<div class="message"><b><i class="far fa-times-circle"></i> </b><span>Du hast den Chat verlassen.</span></div>';
    file_put_contents("log.html", $logout_message);
    $logout_message ='<div class="message"><b><i class="far fa-times-circle"></i> </b><span>Um einen neuen Partner zu suchen tippe <b>:new</b> ein.</span></div>';
    file_put_contents("log.html", $logout_message);
}
?>
<!DOCTYPE html>
<html>
    <head></head>
    <body>
        <form action="#" method="post">
            <input type="text" name="message">
            <input type="sumbit" value="senden">
        </form>
    </body>
</html>