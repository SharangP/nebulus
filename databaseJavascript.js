/*
 *  NebulUs
 *
 *  File: serverJavascript.js
 *  Description: Contains server sided database functionality
 *  Known Bugs: None
 *
 */
       
       
/*
 * Dependency variables
 */
 	var mysql = require('mysql');
    var fs = require('fs');
    var mpdSocket = require('mpdsocket');
	var mpd = new mpdSocket('localhost','6600');
                 
/*
 * Global Variable declarations
 */
 	
 	GLOBAL.songsBySong = new Array();
 	GLOBAL.songsByArtist = new Array();
 	GLOBAL.songsByAlbum = new Array();
 	playlistInfo = new Array();
 	
/*
 * Database interface
 */
    var DATABASE = 'nebulus';
    var client = mysql.createClient({
        user     : 'root',
        password : 'eeonly',
    });
    client.query('USE ' + DATABASE);

/*
 * Functions
 */

/*
 * Internal Functions
 */

    //Returns the art path for a song by searching for images
    //in the album directory. Returns a default image path if
    //no valid images are found
    function getArtPath(sPath){
        var imageTypes = ['jpg','jpeg','png','bmp'];
        var dir = sPath.substring(0,sPath.lastIndexOf('/'));
        var files = fs.readdirSync(dir);
        for(var i = 0; i < files.length; i++)
        {
            if(imageTypes.indexOf(files[i].substring(files[i].lastIndexOf('.')+1)) != -1)
            {
                var tmp = dir.split('/');
                return tmp[tmp.length-2] + '/' + tmp[tmp.length-1] + '/' + files[i];
            }
        }
        return 'albumart.jpg'
    }

/*
 * Exported Functions
 */
 
    //Creates a new admin
  	exports.createAdmin = function createAdmin(User,Pass){
	 	console.log('Creating new Admin');
	 	
	 	try{
	 		client.query('SELECT uName FROM Users U WHERE U.uName = "'+User+'"',function(err, rows, field){
	 			if(rows[0] != undefined){
		 			try{
			 			client.query('INSERT INTO Admins SET uName = ?, password = ?', [User, String(Pass)], function(err){
				 			if(err) throw err;
				 		});	
	 				}
	 				catch(err){
		 				console.log(err);
		 				return;
	 				}
	 			}
	 			else{
	 				console.log('user was not in the users table');
		 			try{
			 			client.query('INSERT INTO Users SET uName = ?', [User], function(err){
				 			if(err) throw err;
				 		});	
				 		
				 		try{
					 		client.query('INSERT INTO Admins SET uName = ?, password = ?', [User, String(Pass)], function(err){
				 				if(err) throw err;
				 			});	
				 		}
				 		catch(err){
					 		console.log(err);
					 		return;
				 		}
	 				}
	 				catch(err){
		 				console.log(err);
		 				return;
	 				}
	 			}
	 		});
	 	}
	 	catch(err){
		 	console.log(err);
		 	return;
	 	}
 	}
 	
    //Creates a new user
	exports.insertUser = function insertUser(User,Pass){ return function(callback) {
	    try {
	    	console.log("Creating new user");
	        client.query(
	            'INSERT INTO Users SET '+
	            'uName = ?',
	            [User],
	            function(err, rows, fields){
	                if(err) throw err;
	                callback(User);
					}	
				);
		    }
	    catch(err) {
	        console.log(err);
	        return;
	    }
	}}

    //Finds users by id
	exports.findById = function findById(id){ return function(callback){
		try{
			 client.query(
                    'SELECT uName, uid '+
                    'FROM Users '+
                    'WHERE uid = ?',
                    [id],
                    function(err, rows, fields){
                        if(err) throw err;
						console.log(rows);
                        callback(null, {
                            username: rows[0]['uName'],
                            uid: rows[0]['uid']});
                    }
                );
		}
		catch(err)
        {
            console.log(err);
            return;
        }
	}}
	
	//Finds users by uName
    exports.findByUsername = function findByUsername(User, Pass){ return function(callback){

        // If the password is 'secret', check for the user in
        // the Users table
        if(Pass == 'secret')
        {
            try{
                client.query(
                
		            'SELECT U.uName, U.uid ' +
					'FROM Users U ' +
					'WHERE U.uName = ? AND U.uName NOT IN ( ' +
					'SELECT A.uName ' +
					'FROM Admins A) ',
                    [User],
                    function(err, rows, fields){
                        if(err) throw err;
						console.log(rows);
                        // If the user doesnt exist, make him/her
                        if(rows.length == 0)
                        {
                            callback({
                                username: false,
                                photo: 'default',
                                password: false,
                                uid: ''});
                    	}
                        else
                            callback({
                                username: rows[0]['uName'],
                                photo: 'default',
                                password: false,
                                uid: rows[0]['uid']});
                    }
                );
            }
            catch(err)
            {
                console.log(err);
                return;
            }
        }
        else
        {
            try{
                client.query(
                    'SELECT A.uName, A.photo, A.password, U.uid '+
                    'FROM Admins A, Users U '+
                    'WHERE A.uName = ? AND A.uName = U.uName',
                    [User],
                    function(err, rows, fields){
                        if(err) throw err;

                        // If the user doesnt exist, set all fields false
                        if(rows.length == 0)
                            callback({
                                username: false,
                                photo: 'default',
                                password: false,
                                uid: ''});
                        else
                            callback({
                                username: rows[0]['uName'],
                                photo: rows[0]['photo'],
                                password: rows[0]['password'],
                                uid: rows[0]['uid']});
                    }
                );
            }
            catch(err)
            {
                console.log(err)
                return;
            }
        }
    }}

 	//Get current playlist info via queries
 	exports.getPlaylistInfo = function getPlaylistInfo(playlist) {return function (callback) {
	playlistInfo=[];
	 	for(var i = 0; i < playlist.length; i++){
	 		try{
	 			//the query might now work... idk if this is valid syntax, now it works
            	client.query('SELECT * FROM Songs WHERE sPath = "'+playlist[i]+'"', function(err, rows, fields){
            		if(rows){
	            		playlistInfo.push({sPath: rows[0]['sPath'], sName: rows[0]['sName'], album: rows[0]['album'], artist: rows[0]['artist'], artPath: rows[0]['artPath']});
            		}
            		    if(playlist[playlist.length-1] == rows[0]['sPath']){callback(playlistInfo);}	
            	});

            }
            catch(err){
            	console.log(err);
            	return;
            }
        }
 	}}
 
    //Get available songs sorted by sName
    exports.getSongsBySongs = function getSongsBySongs(){
        try{
            client.query('SELECT * FROM Songs ORDER BY sName, artist', function(err, rows, fields){
                if(err) throw err;
                
                for(var i = 0; i < rows.length; i++){
                    songsBySong.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], artist: rows[i]['artist'], album: rows[i]['album'], votes: rows[i]['votes'], artPath: rows[i]['artPath'] });
                }
            });
        }
        catch(err){
            console.log(err);
            return;
        }
    }
   
    //Get available songs for user sorted by artist
    exports.getSongsByArtist = function getSongsByArtist(){
        try{
            client.query('SELECT * FROM Songs ORDER BY UPPER(artist), sName', function(err, rows, fields){
                if(err) throw err;
                
                var artistCounter = 0;//first artist
                var currentArtist = rows[0]['artist'];
                songsByArtist.push({artist: currentArtist, song: new Array()});

                for(var i = 0; i < rows.length; i++){
                    if(rows[i]['artist'].toUpperCase() != currentArtist.toUpperCase()){
                        ++artistCounter;
                        currentArtist = rows[i]['artist'];
                        songsByArtist.push({artist: currentArtist, song: new Array()});
                    }
                    songsByArtist[artistCounter].song.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], album: rows[i]['album'], votes: rows[i]['votes'], artPath: rows[i]['artPath']});
                }
            });
        }
        catch(err){
            console.log(err);
            return;
        }
    }
   
    //Get available songs for user sorted by album
    exports.getSongsByAlbum = function getSongsByAlbum(){
        try{
            client.query('SELECT * FROM Songs ORDER BY album, sName', function(err, rows, fields){
                if(err) throw err;
                
                var albumCounter = 0;
                var currentAlbum = rows[0]['album'];
                var currentArtist = rows[0]['artist'];
                var currentArtPath = rows[0]['artPath'];
                songsByAlbum.push({album: currentAlbum, artist: currentArtist, artPath: currentArtPath, song:[]})

                for(var i = 0; i < rows.length; i++){
                    if((rows[i]['album'].toUpperCase() != currentAlbum.toUpperCase()) || (rows[i]['artist'] != currentArtist)){
                        ++albumCounter;
                        currentAlbum = rows[i]['album'];
                        currentArtist = rows[i]['artist'];
                        currentArtPath = rows[i]['artPath'];
                        songsByAlbum.push({album: currentAlbum, artist: currentArtist, artPath: currentArtPath, song:[]}); 
                    }
                    songsByAlbum[albumCounter].song.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], votes: rows[i]['votes']});
                }
            });   
        }    
        catch(err){
            console.log(err);
            return;
        }
    }

    //Add songs listed in the array Songs to our DB
    function addSongs(rootPath, Songs){

        if(Songs.length == 0)
            return;
            
        console.log('Adding Songs...');

        // For each song path, find the song in the MPD DB and
        // retrieve its metadata. Parse the metadata and insert
        // the song into our mysql DB for easy reference by the
        // application
        for(var i = 0; i < Songs.length; i++)
        {
            // add quotes to the path
            var query = 'search any ' + '\"' + Songs[i] + '\"';

            // query the DB
            mpd.send(query, function(){

                var response = mpd.response;

                if(!response)
                    console.log("Couldn't find song: " + Songs[i]);
                else
                {
                    var sName = response['Title'];
                    var artist = response['Artist'];
                    var album = response['Album'];
                    var sPath = response['file'];
                    var votes = 0;
                    var artPath = 'NULL'; //find album art in directory?

                    var pathSplit = sPath.split('/');

                    // handle incomplete metadata
                    if(sPath == undefined)
                    {
                        console.log("ERROR: Song path incorrect: " + Songs[i])
                    }
                    else    // dont insert if there is a path error
                    {
                        artPath = getArtPath(rootPath + sPath);
                        if(sName == undefined)
                        {
                            sName = pathSplit[pathSplit.length-1];
                            sName = sName.substring(0,sName.lastIndexOf('.'))
                        }
                        if(artist == undefined)
                            artist = pathSplit[pathSplit.length-3];
                        if(album == undefined)
                            album = pathSplit[pathSplit.length-2];

                        console.log(artPath);
                        console.log(sName);
                        console.log(artist);
                        console.log(album);
                        console.log(sPath);

                        try{

                            client.query(
                            'INSERT INTO Songs SET '+
                            'sName = ?, '+
                            'artist = ?, '+
                            'album = ?, '+
                            'sPath = ?, '+
                            'votes = ?, '+
                            'artPath = ?',
                            [sName, artist, album, sPath, votes, artPath],
                            function(err, rows, fields){
                                if(err) throw err;
                            }
                            );
                        }
                        catch(err)
                        {
                            console.log(err);
                        }
                    }
                }
            });
        }
    }

    //Sync MPD and sql Databases
    exports.syncDatabase = function syncDatabase(rootMusicPath){

        if(rootMusicPath.charAt(rootMusicPath.length) != '/')
            rootMusicPath += '/';

        var missingSongs = new Array();

        console.log("Syncing databases...");
        mpd.send('listall', function(){

            var mpdSongs = new Array();
            var dbSongs = new Array();

            console.log(mpd.responses);

            // Get a list of songs from mpd and put them in an array
            // sort it to compare linearly with dbSongs, which is
            // obtained in alphabetical order from the db query
            for(var i = 0; i < mpd.responses.length; i++){
                if(mpd.responses[i]['file'] != undefined)
                    mpdSongs.push(mpd.responses[i]['file']); 
                }
            mpdSongs.sort();

            try
            {
                client.query('SELECT sPath from Songs ORDER BY sPath COLLATE latin1_general_cs', function(err, rows, fields) {
                    if(err) throw err;

                    // Get the list of songs in the db, put it in an array
                    for(var i = 0; i < rows.length; i++)
                    { dbSongs.push(rows[i]['sPath']); }

                    // compute the difference between the two arrays
                    // ASSUME THIS IS HOW MANY SONGS ARE MISSING FROM DB
                    var diff = mpdSongs.length - dbSongs.length;

                    if(diff < 0)
                    {
                        console.log("Database has deleted objects in it");
                        /* handle issue:
                         * remove rows from mysql or delete mysql db and update */
                    }
                    else
                    {
                        var mpdPos = 0;
                        var dbPos = 0;
                        while(diff > 0) // while there are still differences
                        {
                            // if a difference is found, see if there is a match within
                            // the next few songs in mpdSongs
                            if(mpdSongs[mpdPos] != dbSongs[dbPos])
                            {
                                var tmpDiff = 1;
                                // while we havent run out of differences, keep
                                // looking for a place where the two arrays match
                                while(tmpDiff < diff)
                                {
                                    if(mpdSongs[mpdPos+tmpDiff] != dbSongs[dbPos])
                                        tmpDiff++;
                                    else
                                        break;
                                }
                                
                                // tmpDiff elements in mpdSongs are different, starting
                                // the dbPos element. handle.
                                diff -= tmpDiff;
                                for(var j = 0; j < tmpDiff; j++)
                                {
                                    missingSongs.push(mpdSongs[mpdPos+j]);
                                }
                                mpdPos += tmpDiff;
                            }
                            
                            mpdPos++;
                            if(dbPos < dbSongs.length)
                                dbPos++;
                            else
                            {
                                //the rest of the paths in mpdSongs are not in the db
                                while(mpdPos < mpdSongs.length)
                                {
                                    missingSongs.push(mpdSongs[mpdPos]);
                                    mpdPos++;
                                    diff--;
                                }
                            }
                        }

                        // add the songs to our DB

                        addSongs(rootMusicPath, missingSongs);
                    }
                });
            }
            catch(err)
            {
                console.log(err);
            }
        }); //end of asynchronous call 'listall'
    }

    //Adds a new playlist to the DB
	exports.addPlaylist = function addPlaylist(name,user){ //return function(callback){
		try{
			    client.query(
                    'INSERT INTO Playlists SET '+
                    'pName = ?, '+
                    'createdBy = ?',
                    [name,user],
                    function(err, rows, fields){
                        if(err) throw err;
                        //callback(1);
                    }
                );
		}
		catch(err)
        {
            console.log(err);
           // callback(0);
        }
	}//}

    //Adds songs to the Active Playlist
	exports.addToPlaylist = function addToPlaylist(playlist,spath){ return function(callback){
		try{
    		    client.query(
                    'INSERT INTO Contains SET '+
                    'pName = ?, '+
                    'sPath = ?',
                    [playlist,spath],
                    function(err, rows, fields){
                        if(err)	throw err;
                        callback(1);
                    }
                );
		}
		catch(err)
        {
            console.log(err);
            callback(0);
        }
	}}

    //Delete songs from the Active Playlist
	exports.delFromPlaylist = function delFromPlaylist(playlist,spath){
		try{
    		    client.query(
                    'DELETE FROM Contains WHERE '+
                    'pName = ? AND '+
                    'sPath = ?',
                    [playlist,spath],
                    function(err, rows, fields){
                        if(err)	throw err;
                    }
                );
		}
		catch(err)
        {
            console.log(err);
        }
	}

    //Up-votes or down-votes songs for users
	exports.alterVote = function alterVote(user,spath,upvote){	
		try{
            if(upvote)
            {
			    client.query(
                    'REPLACE INTO VotedFor SET '+
                    'uName = ?, '+
                    'sPath = ?',
                    [user,spath],
                    function(err, rows, fields){
                        if(err) throw err;
                    }
                );
			    client.query(
                    'UPDATE Songs SET '+
                    'votes = votes+1 '+
                    'WHERE sPath = ?',
                    [spath],
                    function(err, rows, fields){
                        if(err) throw err;
                    }
                );
            }
            else
            {
			    client.query(
                    'DELETE FROM VotedFor WHERE '+
                    'uName = ? AND '+
                    'sPath = ?',
                    [user,spath],
                    function(err, rows, fields){
                        if(err) throw err;
                    }
                );
			    client.query(
                    'UPDATE Songs SET '+
                    'votes = votes-1 '+
                    'WHERE sPath = ?',
                    [spath],
                    function(err, rows, fields){
                        if(err) throw err;
                    }
                );
            }
		}
		catch(err)
        {
            console.log(err);
        }
	}

    //Finds songs starred by a user, sorted by sName
    exports.getStarredSongs = function getSongsBySongs(user){ return function (callback){
        var starred = [];
        try{
               client.query(
                    'SELECT * '+
                    'FROM Songs S '+
                    'WHERE S.sPath IN ( '+
                        'SELECT V.sPath '+
                        'FROM VotedFor V '+
                        'WHERE V.uName = ?) '+
                    'ORDER BY S.sName, S.artist',
                    [user],
                    function(err, rows, fields){
                    	if(err) throw err;
                    	console.log(rows);
                    	for(var i = 0; i < rows.length; i++){
                        	starred.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], artist: rows[i]['artist'], album: rows[i]['album'], votes: rows[i]['votes'], artPath: rows[i]['artPath'] });
                    	}
                    	//console.log("FROM INSIDE OF FUNCTION")
                    	//console.log(starred);
                		callback(starred);    
                });
        }
        catch(err){
            console.log(err);
            callback(starred);
        }
    }}

    //Finds all playlists, sorted by name, user
    exports.getPlaylists = function getPlaylists(){ return function (callback){
        var playlists= [];
        try{
               client.query(
                    'SELECT * FROM Playlists '+
                    'ORDER BY pName, createdBy',
                    function(err, rows, fields){
                    	if(err) throw err;
                    	for(var i = 0; i < rows.length; i++){
                        	playlists.push({pName: rows[i]['pName'], uName: rows[i]['createdBy'] });
                    	}
                    	callback(playlists);
                });
        }
        catch(err){
            console.log(err);
            callback(playlists);
        }
    }}
    
    //Get the songs in a playlist
    exports.getPlaylistSongs = function getPlaylistSongs(pname){ return function(callback){
	    var playlistSongs = [];
	    
        try{
               client.query(
                    'SELECT * '+
                    'FROM Songs '+
                    'WHERE sPath IN ('+
                    	'SELECT sPath '+
                    	'FROM Contains '+
                    	'WHERE pName = ?) '+
                    'ORDER BY votes',
                    [pname],
                    function(err, rows, fields){
                    	if(err) throw err;
                    	for(var i = 0; i < rows.length; i++){
                        	playlistSongs.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], artist: rows[i]['artist'], album: rows[i]['album'], votes: rows[i]['votes'], artPath: rows[i]['artPath'] });
                    	}
                    	callback(playlistSongs);
                });
        }
        catch(err){
            console.log(err);
            callback(playlistSongs);
        }
    }}


    //Search for songs based on the sPath stringe
    exports.search = function search(query){ return function (callback){
        var results = [];
        try{
               client.query(
                    'SELECT * '+
                    'FROM Songs S '+
                    'WHERE S.sPath LIKE CONCAT(\'%\',?,\'%\')',
                    [query],
                    function(err, rows, fields){
                    	if(err) throw err;
                    	console.log(rows);
                    	for(var i = 0; i < rows.length; i++){
                        	results.push({sName: rows[i]['sName'], sPath: rows[i]['sPath'], artist: rows[i]['artist'], album: rows[i]['album'], votes: rows[i]['votes'], artPath: rows[i]['artPath'] });
                    	}
                		callback(results);    
                });
        }
        catch(err){
            console.log(err);
            callback(results);
        }
    }}
    
    //exports.addSongs = addSongs;

