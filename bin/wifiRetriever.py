#! /usr/bin/python2.7
import urllib2
import getpass
from BeautifulSoup import BeautifulSoup
import re

url = 'https://guestgw.wireless.ucar.edu/password.html'
#username = getpass._raw_input('What is your username?: ')
username = getpass.getuser()
password = getpass.unix_getpass(username + ' please enter your UCAS Password: ')
p = urllib2.HTTPPasswordMgrWithDefaultRealm()

p.add_password(None, url, username, password)

handler = urllib2.HTTPBasicAuthHandler(p)
opener = urllib2.build_opener(handler)
urllib2.install_opener(opener)

page = urllib2.urlopen(url).read()
soup = BeautifulSoup(page)

data = soup.findAll('strong')

value= re.sub("<.*?>", "", str(data))

print value
