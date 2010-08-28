import os
import sys
import time
import subprocess
import fnmatch

file = sys.argv[1]
rootpath = os.getcwd()
files = {}
refreshTime = 1

if file == "":
    print "Usage: python refreshOnEdit.py YourFile.py"
    exit(0)

#parse directories

def getLastModified():
    filesdir = {}
    pattern = "*.*"
    for root, dirs, curfiles in os.walk(rootpath):
        for filename in fnmatch.filter(curfiles, pattern):
            pth = os.path.join(root, filename)
            filesdir[pth] = os.stat(pth).st_mtime
    return filesdir

print "Running %s..." % file
while True:
    id = subprocess.Popen(['node', file]) #Open the process in the background
    while True:
        files = getLastModified()
        time.sleep(refreshTime) #check every x seconds for a change
        escape = False
        for f in files:
            if not os.path.isfile(f) or os.stat(f).st_mtime != files[f]:
                print "File modified. Reloading..." 
                escape = True
                break

        if escape: break

    id.kill()

