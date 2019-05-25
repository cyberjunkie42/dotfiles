#!/bin/python2.7
import random

chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789!@#$%&?'

password = ""
for c in range(18):
    password += random.choice(chars)
print(password)
