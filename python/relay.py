#/!usr/bin/env
import os, sys
from datetime import datetime

from  pyGPIO.gpio import gpio, port
from time import sleep

def getCmd():
    lines = sys.stdin.readlines()
    return lines[0]

def main():
    gpio.init()
    gpio.setcfg(port.STATUS_LED,1)
    gpio.output(port.STATUS_LED,1)
    sleep(1)
    gpio.output(port.STATUS_LED,0)
    sleep(0.5)
    gpio.output(port.STATUS_LED,1)
    sleep(0.5)
    gpio.output(port.STATUS_LED,0)
    sleep(0.5)
    gpio.output(port.STATUS_LED,1)
    sleep(0.5)
    gpio.output(port.STATUS_LED,0)
    while True:
	cmd = getCmd()
       	print("From motor",cmd);
	sys.stdout.flush()
        if(cmd=="true"):
            gpio.output(port.STATUS_LED,1)
        else:
            gpio.output(port.STATUS_LED,0)

if __name__ == '__main__':
    main()
