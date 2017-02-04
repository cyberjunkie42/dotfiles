#! /usr/bin/python

import requests
#import datetime
import subprocess
import sys
import argparse
import re


def check_arg(args=None):
    parser = argparse.ArgumentParser(description='Script to generate EV NOW tickets.')
    parser.add_argument('-H', '--host',
                        help='host',
                        required='True',
                        default='Cheyenne')
    parser.add_argument('-a', '--alert',
                        help='alert type, Red or Yellow',
                        required='True',
                        default='Yellow')
    parser.add_argument('-u', '--user',
                        help='user name',
                        default='casg')

    results = parser.parse_args(args)
    return (results.host, results.alert, results.user)


if __name__ == '__main__':
    host, alert, user = check_arg(sys.argv[1:])

#
# handle incorrect entry for hostname
#
def errorhost(host):
    print("Incorrect hostname was entered on the command line.\n" +
          "")
    print("You entered: " + host)
    return

#
# handle incorrect entry for alert
#
def erroralert(alert):
    print("Incorrect alert was entered on the command line.\n" +
          "")
    print("You entered: " + alert)
    return

#
# validate hostname entered
#
host_validate = re.fullmatch('C|Cheyenne', host, re.IGNORECASE)

if host_validate:
    host = "Cheyenne"
    category = str(55322) #55322
    hostname = str(55327) #55327
else:
    host_validate = re.fullmatch('L|Laramie', host, re.IGNORECASE)
    if host_validate:
        host = "Laramie"
        category = str(55317)  # 55317
        hostname = str(55337)  # 55337
    else:
        errorhost(host)
        sys.exit(1)

#
# validate alert entered
#
alert_validate = re.fullmatch('R|Red', alert, re.IGNORECASE)

if alert_validate:
    alert = "RED"
else:
    alert_validate = re.fullmatch('Y|Yellow', alert, re.IGNORECASE)
    if alert_validate:
        alert = "Yellow"
    else:
        erroralert(alert)
        sys.exit(1)

#
# username of user who this will be assigned to
#
assignerUsername = user

#
# The short description field like the one in extraview
#
shortDescription = alert + " Nagios Alert -- NOW " + host
fullDescription = """The Nagios monitoring systems has detected a """ + alert + """ alert.

NOW-""" + host

#
# you can change weeks to days or months, seconds, years or whatever is needed.
#
## <future need?> dateNeeded = str(datetime.date.today() + datetime.timedelta(weeks=1))

#
# fullDescription = fullDescription.format(dateNeeded)
#
def sendrequest():
    # this is where you will change options for the tickets.
    payload = (("user_id", "casg"),
               ("password", "WeM0n1t0r"),
               ("statevar", "insert"),
               ("send_mail", "yes"),
               ("short_descr", shortDescription),
               ("description", fullDescription),
               ("area", "1"),
               ("project", "1"),
               ("status", "TRANSFERRED"),
               ("priority", "P3"),
               ("help_login", assignerUsername),
               ("username_display", "ID"),
               ("requestor_name", getassignername(assignerUsername)),
               ("requestor_email", getassigneremail(assignerUsername)),
               ("contact_phone", getassignerphone(assignerUsername)),
               # ("date_needed", dateNeeded),
               ("help_category", category),
               ("help_hostname_category", "3304"),
               ("help_hostname", hostname),
               ("help_hard_type", "3284"),
               ("help_classification", "17434"),
               ("help_assign_group", "217"),
               ("help_type", "67"),
               ("submission_type", "52492"),
               ("help_location", "20241"),
               ("casg_duty_type", "54721"),
               ("casg_duty_stakeholder", "49082"),
               ("interest_list_box", "ssg;casg"),
               )

    try:
        response = requests.post(
            # This is the base url you can change it to the test site for testing
            # --- CODED FOR PRODUCTION UNCOMMENT LINE BELOW FOR TESTING AND COMMENT PRODUCTION LINE ---
        url="https://extraview.ucar.edu:443/evj/ExtraView/ev_api.action", params=payload)
        #url="https://test.extraview-tomcat.ucar.edu:8443/evj/ExtraView/ev_api.action", params=payload)
        #
        print('Response HTTP Status Code: {status_code}'.format(
            status_code=response.status_code))
        print('Response HTTP Response Body: {content}'.format(
            content=response.content))
    except requests.exceptions.RequestException:
        print('HTTP Request failed')


def getassignername(assignee):
    name = subprocess.check_output(
        "curl -G -s \"http://casg.nwsc.ucar.edu/ldap.php?search=" + 
        assignee + "&field=name\"", shell=True)
    return name


def getassigneremail(assignee):
    email = subprocess.check_output(
        "curl -G -s \"http://casg.nwsc.ucar.edu/ldap.php?search=" + 
        assignee + "&field=email\"", shell=True)
    return email


def getassignerphone(assignee):
    phone = subprocess.check_output(
        "curl -G -s \"http://casg.nwsc.ucar.edu/ldap.php?search=" + 
        assignee + "&field=phone\"", shell=True)
    return phone

sendrequest()
