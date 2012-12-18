#!/usr/bin/python

#####################################
# mass adding python script
#
# adds songs in new music path directory, recursively
# to correct location in nebulus music directory based
# on metadata
#
# checks for attached images using mutagen, and places
# images into the song's album directory, putting it
# into jpeg format
#
# allows the option to delete all files from the source
# of import
#####################################

import os
import sys
from shutil import move, rmtree
from hsaudiotag import auto
from mutagen import File

rootMusicPath = ''
newMusicPath = ''
remove = False
audioTypes = ['.mp3','.MP3','.mpa','.MPA','.mp4','.m4a','.flac','.FLAC','.ogg','.OGG']
imageTypes = ['.jpg','.jpeg','.bmp','.png']
allSongs = []
allImages = []

class MyError(Exception):
    def __init__(self, value):
        self.value = value
    def __str__(self):
        return repr(self.value)

# get tags using hsaudio
# extract unwanted characters like '/' from tags
# if an artist or album tag cannot be found,
# assign it Unknown. If a title tag cannot
# be found, take the basemane of the file
def getTags(song):

    tags = auto.File(song)
    if tags.valid:

        Artist = tags.artist
        Album = tags.album
        Title = tags.title

        if not Artist:
            Artist = 'Unknown'
#        else:
#            Artist = Artist.translate(None,'/')

        if not Album:
            Album = 'Unknown'
#       else:
#            Album = Album.translate(None,'/')

        if not Title:
            Title, separator, extension =  (os.path.basename(filename)).rpartition('.')

        return (Artist, Album, Title)

    else:
        raise MyError('Metadata')

# find or make a directory for the song
# the directory structure is:
# rootPath/Artist/Album/song
# if an exception is caught internally,
# raise a MyError exception
def getNewDir(rootPath, Artist, Album):
    try:
        curDir = rootPath + Artist + '/'
        if not os.path.isdir(curDir):
            os.mkdir(curDir)

        curDir += Album + '/'
        if not os.path.isdir(curDir):
            os.mkdir(curDir)

        return curDir

    except Exception:
        raise MyError('getNewDir')


# check arguments passed to script
# ensure paths are valid directories
# if the optional third parameter is R, set the remove
# bit, which will delete all files under newMusicPath
if len(sys.argv) > 2:

    rootMusicPath = sys.argv[1]
    newMusicPath = sys.argv[2]
    if len(sys.argv) > 3:
        if sys.argv[3] == 'R':
            remove = True

    if not os.path.isdir(rootMusicPath):
        sys.exit("Incorrect root music directory")
    else:
        if not rootMusicPath.endswith('/'):
            rootMusicPath += '/'

    if not os.path.isdir(newMusicPath):
        sys.exit("Incorrect new music directory")
    else:
        if not newMusicPath.endswith('/'):
            newMusicPath += '/'
else:
    sys.exit("Error: not enough arguments")

print "Importing music from: " + newMusicPath + " to: " + rootMusicPath

# extract all image and audio files in newMusicPath
# ignore hidden files, and only consider valid formats
for dirname, dirnames, filenames in os.walk(newMusicPath):
    for filename in filenames:
        if not os.path.basename(filename).startswith('.'):
            if os.path.splitext(filename)[1] in audioTypes:
                allSongs.append(os.path.join(dirname, filename).decode('utf_8'))
            elif os.path.splitext(filename)[1] in imageTypes:
                allImages.append(os.path.join(dirname,filename).decode('utf_8'))

# add valid image files:
# for every valid image, check for an album tag
# among the songs in the same directory. If it exists,
# place the artwork in the album's directory. Otherwise,
# check the immediate parent directory for an album tag
for image in allImages:
    if os.path.isfile(image):
        for dirname, dirnames, files in os.walk(os.path.dirname(image)):
            for song in files:
                if os.path.splitext(song)[1] in audioTypes:
                    try:
                        artist, album, title = getTags(song)
                        picFile = getNewDir(song) + album + '.jpg'
                        if not os.path.isfile(newImage):
                            move(image,newImage)
                        break
                    except:
                        print 'Error processing image: ', image

# add valid audio files
# move them into the appropriate directory, and
# extract valid attached images and place them in the
# album's directory. Only allow one image per album
for song in allSongs:
    if os.path.isfile(song):
        print 'processing file: ', song
        try:
            artist, album, title = getTags(song)
            newDir = getNewDir(rootMusicPath, artist, album)

            # if getTags works, try to get attached image
            # if an attached image is found, check if one
            # already exists for that album. If it doesnt,
            # copy the new image into the correct album dir
            mutagenFile = File(song)
            art = mutagenFile.tags['APIC:'].data
            if art:
                picType = ''
                # check extension and append the correct one
                if mutagenFile.tags['APIC:'].mime.endswith('png'):
                    picType = 'png'
                elif mutagenFile.tags['APIC:'].mime.endswith('jpeg'):
                    picType = 'jpg'
                else:
                    break
                picFile = newDir + album + '.' + picType

                if not os.path.isfile(picFile):
                    with open(picFile, 'wb') as pic:
                        pic.write(art)

        # exceptions that are not of type MyError can be
        # ignored, however MyError exceptions mean the
        except Exception as e:
            print e
            if isinstance(e, MyError):
                print 'Error importing file: ', song
                print e
            elif not os.path.isfile(newDir + os.path.basename(song)):
                move(song,newDir)

if remove:
    print 'Removing files from: ', newMusicPath
    for dirname, dirnames, files in os.walk(newMusicPath):
        for subdir in dirnames:
            try:
                rmtree(os.path.join(dirname,subdir))
            except Exception as e:
                print e

