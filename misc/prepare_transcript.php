<?php 
// function to prepare transcript before deilvery to main editor
function prepare_transcript($transcript) {
    $transcript = json_decode($transcript, true); // if transcript received as string

    foreach($transcript['results'][0]['results'] as $r_i => $result) {
        foreach($result['alternatives'] as $a_i => $alternative) {
            foreach($alternative['timestamps'] as $w_i => $word) {
                $transcript['results'][0]['results'][$r_i]['alternatives'][$a_i]['timestamps'][$w_i][0] =  $transcript['results'][0]['results'][$r_i]['alternatives'][$a_i]['timestamps'][$w_i][0].' ';
            }
        }
    }

    $transcript = json_encode($transcript);
}
?>
