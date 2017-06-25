<?php

$audioURL = "new-york-rock.mp3";
$peaks = shell_exec("python get_peaks.py ".$audioURL);

$meta = '{"peaks": '.$peaks.'}';

echo $meta;

?>
