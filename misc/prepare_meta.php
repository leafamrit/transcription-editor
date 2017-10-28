<?php
$audioURL = "../audio/new-york-rock.flac";
$meta = shell_exec("python get_meta.py ".$audioURL);
echo $meta;
?>
