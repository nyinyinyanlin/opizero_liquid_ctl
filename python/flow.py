#/!usr/bin/env
import os, sys
from datetime import datetime

from  pyGPIO.gpio import gpio, port
from time import sleep

def main():
    gpio.init()
    gpio.setcfg(port.GPIO17,0)
    cur = gpio.input(port.GPIO17)
    start = datetime.now()
    while (gpio.input(port.GPIO17)==cur):
        now = datetime.now()
        delta = now - start
        if(delta.seconds>=60)
            print("0")
            exit()
    now = datetime.now()
    delta = now - start
    if(delta.microseconds<=10000):
        print("1")
    else:
        print("0")

if __name__ == '__main__':
    main()
