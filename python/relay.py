#/!usr/bin/env
import os, sys
from  pyGPIO.gpio import gpio, port

def main():
	gpio.init()
	gpio.setcfg(port.STATUS_LED,1)
	gpio.output(port.STATUS_LED,0)
	print(sys.argv)
    	if("on"==sys.argv[1]):
        	gpio.output(port.STATUS_LED,1)
        	print("STATUS_LED ON")
    	else:
        	gpio.output(port.STATUS_LED,0)
        	print("STATUS_LED OFF")

if __name__ == '__main__':
    main()
