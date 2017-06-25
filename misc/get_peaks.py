from subprocess import run, PIPE
import sys

audioURL = str(sys.argv[1])

length = float(run(['sox', audioURL, '-n', 'stat'], stderr=PIPE).stderr.decode('UTF-8').split('\n')[1][17:].strip())
timeslice = length / 1000

peaks = []
current = 0

while current < length:
    options = run(['sox', audioURL, '-n', 'trim', str(current), '0.05', 'stat'], stderr=PIPE).stderr.decode('UTF-8').split('\n')
    for i in range(len(options)):
        if options[i].find('Maximum amplitude:') > -1:
            peaks.append(float(options[i][18:].strip()))
            break
    current += timeslice

print(peaks)
