from subprocess import run, PIPE
import sys

def get_length():
    options = run(['sox', audioURL, '-n', 'stat'], stderr=PIPE).stderr.decode('UTF-8').split('\n')
    for option in options:
        if option.find('Length') > -1:
            return float(option[17:].strip())

def get_peaks(timeslice, duration):
    peaks = []
    current = 0

    while current < length:
        options = run(['sox', audioURL, '-n', 'trim', str(current), str(duration), 'stat'], stderr=PIPE).stderr.decode('UTF-8').split('\n')
        for option in options:
            if option.find('Maximum amplitude:') > -1:
                peaks.append(float(option[18:].strip()))
                break
        current += timeslice

    return peaks

def get_silences(peak_slice, peak_duration, silence_threshold):
    silence_peaks = get_peaks(peak_slice, peak_duration)
    silences = {}
    for i in range(len(silence_peaks)):
        if abs(silence_peaks[i]) < silence_threshold:
            start = round(peak_slice * i, 1)
            while(i < (len(silence_peaks) - 1) and silence_peaks[i] < silence_threshold):
                i += 1
            end = round((peak_slice * i) - 0.2, 1)
            if end > round(start + 0.2, 1):
                silences[str(round(start - 0.2, 1))] = end
                silences[str(round(start - 0.1, 1))] = end
                silences[str(start)] = end
                silences[str(round(start + 0.1, 1))] = end
                silences[str(round(start + 0.2, 1))] = end

    return silences

audioURL = str(sys.argv[1])
length = get_length()

meta = {}
meta["peaks"] = get_peaks(length / 500, 0.05) # extract maximum amplitude at every (length / 500)s while testing for 0.05s
meta["silences"] = get_silences(0.2, 0.2, 0.009)

print(str(meta).replace("\'", "\""))
