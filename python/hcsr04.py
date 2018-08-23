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
	gpio.setcfg(port.GPIO3,1)
	gpio.setcfg(port.GPIO7,1)
	gpio.output(port.GPIO7,0)
	gpio.setcfg(port.GPIO7,0)

	while True:
        cmd = getCmd()
        if(cmd=="sense"):
    	     n = 0
           	 distance = 0
           	 while n < 20:
                gpio.output(port.GPIO3, 1)
                sleep(10/1000000.0)
                gpio.output(port.GPIO3,0)
                while(gpio.input(port.GPIO7)==0):
                    pass
                start = datetime.now()
                while(gpio.input(port.GPIO7)):
                    pass
                end = datetime.now()
                delta = end - start
                delta = delta.microseconds
                distance += ((delta*17150)/1000000.0)
                n += 1
                sleep(0.2)
           	 distance = distance / 20.0
           	 print(distance)
    	     sys.stdout.flush()

if __name__ == '__main__':
	main()
