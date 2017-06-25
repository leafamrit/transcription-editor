<?php

$audioURL = "new-york-rock.mp3";
$meta = shell_exec("python get_peaks.py ".$audioURL);



echo $meta;

?>
