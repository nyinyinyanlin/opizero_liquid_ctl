#/!usr/bin/env
import os, sys
from  pyGPIO.gpio import gpio, port

def main():
	gpio.init()
	gpio.setcfg(port.STATUS_LED,1)
	gpio.output(port.STATUS_LED,1)
    if(cmd=="true"):
        gpio.output(port.STATUS_LED,1)
    else:
        gpio.output(port.STATUS_LED,0)

if __name__ == '__main__':
    main()
