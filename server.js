/*
 * NebulUs
 */

/*
 * Dependency variables
 */
    var util = require('util');
    var exec = require('child_process').exec;
    var mpdSocket = require('mpdsocket');
    var mpd = new mpdSocket('localhost','6600');
    var nowjs = require("now");
    var express = require('express');
    var app = express();
    var http = require('http');
    var DB = require('./databaseJavascript.js');
    var passport = require('passport');
    var flash = require('connect-flash');
    var LocalStrategy = require('passport-local').Strategy;

/*
 * Create server
 */
	var Admins = [];
	
    passport.serializeUser(function(user, done) {
		console.log("serializing");
  		done(null, user.uid);
	});

	passport.deserializeUser(function(id, done) {
		DB.findById(id) (function(err,user){
    		console.log(user);
    		done(err, user);
  		});
	});

    //Define session strategy
	passport.use(new LocalStrategy(
  		function(username, password, done) {
    		// asynchronous verification, for effect...
    		process.nextTick(function () {
      
      		// Find the user by username.  If there is no user with the given
      		// username, or the password is not correct, set the user to `false` to
      		// indicate failure and set a flash message.  Otherwise, return the
      		// authenticated `user`.
        		DB.findByUsername(username, password) ( function(user){
            		
            		if(user['username']) {
                		//apend to user list?
                		if(user['password']) {
                    		if(user['password'] != password)
                        		return done(null, false, {message: 'Invalid password'});
                   			else {
                    			Admins.push(user.username);
                    		}  
                		}
                		return done(null, user);
            		}	
            		else
                		return done(null,false, {message: 'Unknown user'});
        		});
    		});
	}));

    //Configure the server
	app.configure(function() {
		app.use(express.cookieParser());
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.session({ secret: "'keyboard cat'"}));
		app.use(flash());
		app.use(passport.initialize());
		app.use(passport.session());
		app.use(express['static'](__dirname + '/public'));
		app.use(express['static']('/home/pi/music'));
	});

/*
 * Handle various page requests
 */
	app.get('/', checkAuthenticated, function (req, res) {
		res.sendfile(__dirname + '/views/index.html',{ user: req.user, message: req.flash('error') });
	});
	
	app.get('/general', ensureAuthenticated, function (req, res) {
		res.sendfile(__dirname + '/views/general.html', { user: req.user });
	});
	
	app.get('/admin', ensureAdmin, function (req, res) {
		res.sendfile(__dirname + '/views/admin.html', { user: req.user });
	});
	
	app.get('/logout', function(req, res){
	  req.logout();
	  res.redirect('/');
	});
	
	//stuff to get username on pageLoad!
    app.get('/getUName', function(req, res){
        var uName = { uName: req.user.username };
        var uNameJSON = JSON.stringify(uName);
        res.writeHead(200, {'content-type': 'text/json' });
        res.write(uNameJSON);
        res.end();
    });
	
	app.post('/', 
	    passport.authenticate('local', {failureRedirect: '#', failureFlash: true }),
  	    function(req, res) {
    	    res.redirect('#');
  	});

	function ensureAuthenticated(req, res, next) {
  		if (req.isAuthenticated()) { return next(); }
  			res.redirect('/');
	}

	function checkAuthenticated(req, res, next) {
  		if (req.isAuthenticated()) {   res.redirect('/admin'); }
			return next(); 
	}

	function ensureAdmin(req, res, next) {
  		if (req.isAuthenticated() && isAdmin(req.user)) { return next(); }
  			res.redirect('/general');
	}

	function isAdmin(user) {
		for(i = 0; i < Admins.length; i++){
			if(user.username==Admins[i]) {return true;}	
		}
		return false;
	}

    //Create server and make it listen on port 3000	
	var server = http.createServer(app).listen(3000);

/*
 *  Variable declarations
 */
	var everyone = require("now").initialize(server);
    var statusv= 'pause';
    var curSongNum = 0;
    var curTime=0;
    var curSongLength=0;
    var curSongTime;
    var curTitle= '';
    var playlist = new Array();
    var voteCount = new Array();
    var plInfo = new Array();
    var playlistSize=0;
    var seekBool=false;
    var voteInfo = new Array();
	var addqueue= new Array();
	var cLog= new Array();
	var noplaylist=false;

/*
 *  Get available songs for users.
 */
 	DB.getSongsBySongs();
 	DB.getSongsByArtist();
 	DB.getSongsByAlbum();
    addMpd('delete all');
    //setTimeout(cSend("play"),500);

/*
 * Functions
 */
    //Send command to mpd, log output to console
    function cSend(cmd) {
	    mpd.send(cmd,function() {
	    });
    }
    
    //Add to log of commands (no longer used)
    function addLog(string) {
	    cLog.push(string);
    }
    
    //Server side logic to check current state of mpd
    everyone.now.checkValue = function() {
	    //console.log(this.now.command);

        if(this.now.command=="play" ||this.now.command=="pause"){
			cSend(this.now.command);
		}
		else{
        	addMpd("trigger",this.now.command,this.now.status);
		}
		statusv=this.now.status;
        everyone.now.setStatus(statusv);
	    upSongNum();
	    upTime();
    }
      
    //Sets initial status for new clients  
    everyone.now.askStatus= function() {    	    
        this.now.setStatus(statusv);
        this.now.setcLog(cLog);
	    upSongNum();
	    upTime(); 
	    setTimeout(upPlaylist(this),500);
	}

	//Seek song
    everyone.now.seekSong= function(seekTime) {
	    seekBool=true;
	    setTimeout(function(){seekBool=false;},2500);
	    mpd.send("seek "+String(curSongNum)+' '+String(seekTime), function() {console.log('seeking to '+ String(seekTime));});
	    upTime();
    }
    
    //Create a new user 
    everyone.now.addUser= function(user) {
    	var asker=this;
		DB.insertUser(user,'') (function(newuser) {
			console.log("now "+newuser);
			asker.now.sendNewUser(newuser);
		});
    } 
   
   	//Create a new playlist in the database
    everyone.now.createPlaylist = function(user, pName) {
        DB.addPlaylist(pName, user);   
    } 

	//Return a list of playlists already in the database
    everyone.now.askPlaylistList = function() {
        asker = this;
        DB.getPlaylists()(function(plistList){
        	asker.now.setPlaylistList(plistList); });
    }

	//Return a list of songs liked by user
    everyone.now.askLikedSongList = function(user) {
        asker = this;
        DB.getStarredSongs(user)(function(starred){
        	asker.now.setLikedSongs(starred); });
    }

	//Return a list of songs in database that match searchKey
    everyone.now.askSearchWholeDB = function(searchKey){
        asker = this;
        DB.search(searchKey)(function(searchedList){
            asker.now.setDBSearch(searchedList);
        });
    }
 
 	//Create a new admin
    everyone.now.createAdmin= function(user, pass) {
		DB.createAdmin(user,String(pass));
    }
    
    //Load a new playlist to the player
    everyone.now.loadNewPlaylist = function(pName) {
        
        cSend("pause");   	  
		curTime=0;
		curSongNum=0;
        addMpd('delete all');
        voteCount = new Array();
        voteInfo = new Array();
        
        DB.getPlaylistSongs(pName)(function(ian){
	        for(var i = 0; i < ian.length; ++i)
	        {
		        addMpd('add',ian[i].sPath);
	        }
	        upPlaylist(everyone);
        });
    }
     
    //Get song info for add page
    everyone.now.askSongInfo = function() {
	    console.log('askSongInfo called:');
	    //console.log(songsByArtist);
	    //console.log(songsByAlbum);
	    //console.log(songsBySong);
	    this.now.setSongInfo(songsByArtist,songsByAlbum,songsBySong);
    }
    
    //Add a song to the playlist
    everyone.now.addSong = function(path, name, user, playlistName) {
	    console.log('adding song:   '+path);
		var songAlreadyHere=false;
		 DB.addToPlaylist(playlistName, path, playlist.length+1)(function(wasAdded){
		 	if(wasAdded){
		 		addMpd('add',path);
		 		voteCount.push(0); 
		 	}
		 });
		
        }

	//Add multiple songs to the playlist
    everyone.now.addMultSong = function(paths, user) {
     	console.log("Adding Mutliple songs");
     	//add multiple songs to database

	    for(var k=0; k < paths.length; k++){
			//console.log('adding song:   '+paths[k].sPath);
			var songAlreadyHere=false;
			for(var i = 0; i < playlist.length; i++){
				if(paths[k].sPath==playlist[i]){
				songAlreadyHere=true;
				//console.log("Already in playlist");
				}
			}
			if(!songAlreadyHere) {addMpd("add",paths[k].sPath);}
	    }
    }
    
    //Delete a song from the playlist
    everyone.now.delSong = function(i, user, currentPlaylistName) {

			// Delete from voteInfo first (utilizes the playlist)
			for( var userID in voteInfo){
				for(var song in voteInfo[userID].votedSongs){
					if(voteInfo[userID].votedSongs[song]==playlist[i])
					{
						voteInfo[userID].votedSongs.splice(song);
						break;
					}
				}
			}
			addMpd('delete',String(i));
			DB.delFromPlaylist(currentPlaylistName,playlist[i]);
            voteCount.splice(i,1);
    }

	//Delete all songs from the playlist
    everyone.now.delAll = function(user) {
		addMpd('delete all');
		//delete all from playlist in database
		voteCount = new Array();
		voteInfo = new Array();			
    }
        
    //To avoid overloading the raspberry pi we had to
    //limit the number of commands per second so we 
    //created a commandQueue
    function startCommandQueue(){
	    var line;
	    var refid= setInterval(function() {
			if(0<addqueue.length){
				line=addqueue.shift()
				if(line.command=="add"){
				mpd.send('add "'+line.arg1+'"', function() {console.log('added song:   '+line.arg1);}); 
				voteCount.push(0);
				}
				else if(line.command=="trigger") {
					cSend(line.arg1);
					if (line.arg1=="next"){
						if(line.arg2=='play'){
							if(curSongNum!=playlistSize) {curSongNum++;}		
							else{resetPlaylist();}
						}
						else {
							cSend('pause');
							if(curSongNum!=playlistSize) {curSongNum++;}
							else{resetPlaylist();}						
						}	
					}
					if(line.arg1=="previous"){
						if( line.arg2=='play') {
							if(curSongNum!=0) {curSongNum--;}		
						}
						else {
							cSend('pause');
							if(curSongNum!=0) {curSongNum--;}
						}		
						setTimeout(percDown(),35);
					}
				}
				else if(line.command=="delete") {
				mpd.send('delete "'+line.arg1+'"', function() {console.log('deleted song:   '+line.arg1); console.log(mpd.response);}); 
				}
				else if(line.command=="delete all") {
				mpd.send('clear', function() {console.log('cleared playlist'); console.log(mpd.response);});
				//addMpd("trigger","play");
				statusv="pause"; 
				}
			}
			else if(0==addqueue.length){
				upPlaylist(everyone);
				clearInterval(refid);
			}
	    },75);
	}

	//Add an mpd function to the queue
	function addMpd(cmd, arg1, arg2){
		arg1 = arg1 || null;
		arg2 = arg2 || null;
	
		if(addqueue.length == 0){
			addqueue.push({command: cmd, arg1: arg1, arg2: arg2});
			startCommandQueue(); 
		}
		else{
			addqueue.push({command: cmd, arg1: arg1, arg2: arg2});
		}
	}
	
	//Update the playlist
	function upPlaylist(sendto){
		//mpd.responses=[];
		mpd.send('playlistinfo', function(){
			var input = mpd.responses;			
			playlist=[];

			for(var i=0; i<input.length; i++){
				playlist.push(input[i].file);
			}

		    while(voteCount.length<playlist.length){ voteCount.push(0);}
		    
		    if(playlist.length==0){
		    	noplaylist=true;
		    	sendto.now.getPlaylist(new Array(), voteCount, curSongNum, curTitle, noplaylist);
	    	}
		    else{
		    	noplaylist=false;
		    	DB.getPlaylistInfo(playlist) ( function(pli) { sendto.now.getPlaylist(pli, voteCount, curSongNum, curTitle, noplaylist); plInfo=pli;});
		    }
		    
			
			playlistSize=(playlist.length-1);
		});
	}
	
	//Add votes to a song. This tracked in
	//database and an array to handle reordering 
	//the playlist and keep track of starred songs
	everyone.now.addCount = function(i,user) {

		var doUpvote = true;
		var k=0;

		if(voteInfo.length == 0){
			voteInfo.push({username: user, votedSongs: []});
		}
		else{
			while(k<voteInfo.length){
				if(voteInfo[k].username == user){
					var j=0;
					while(j<voteInfo[k].votedSongs.length){
						if(voteInfo[k].votedSongs[j] == playlist[i]){
							doUpvote = false;
							this.now.alertUpvote();
							break;
						}
						j++;
					}
					break;
				}
				k++;
			}
			if(k==voteInfo.length){
				voteInfo.push({username: user, votedSongs: []});
			}
		}

		console.log(voteInfo);
		
		if(doUpvote){
				voteInfo[k].votedSongs.push(playlist[i]);
				voteCount[i]=voteCount[i]+1;
				addLog(user+" upvoted song: "+plInfo[i].sName);

				if(voteCount[i]>voteCount[i-1]) {
					var tempCount = voteCount[i];
					var n = i;
					while( n>(curSongNum+1)){
						if(tempCount >voteCount[n-1]){
							voteCount[n]=voteCount[n-1];
							n--;
							}
						else{
								break;
						}
					}
					voteCount[n] = tempCount;
					mpd.send(("move "+ String(i) +" " +String(n)), function() {console.log("Song Moved from Pos "+ String(i) +" to" + String(n) +"MOVE MOVE MOVE MOVE");});
					}

				upPlaylist(everyone);
				DB.alterVote(user,plInfo[i].sPath,1);
		}
	}

	//Reorder the playlist
	function reorderPL() {
		for(var i=0; i<playlist.length-1;i++){
			//console.log(i);
			if(voteCount[i]>voteCount[i-1]) {
				var tempCount = voteCount[i];
				var n = i;
				while(n>0){
					if(tempCount >voteCount[n-1]){
						voteCount[n]=voteCount[n-1];
						n--;
						}
					else{
						break;
					}
				}
				voteCount[n] = tempCount;
				
				mpd.send(("move "+ String(i) +" " +String(n)), function() {console.log("Song Moved from Pos "+ String(i) +" to" + String(n) +"MOVE MOVE MOVE MOVE");});
			}
		}
	}

	//Move down in the playlist
	function percDown(){
		var oldIndex = curSongNum+1;
		if(voteCount[oldIndex] < voteCount[oldIndex+1]){
			var tempCount = voteCount[oldIndex];
			var newIndex = oldIndex;

			while(newIndex<voteCount.length-1){
				if(tempCount <voteCount[newIndex+1]){
					voteCount[newIndex] =voteCount[newIndex+1];
					newIndex++;
				}
				else{
					break;
				}
			}
			voteCount[newIndex]=tempCount;
			mpd.send(("move "+String(oldIndex)+ " "+ String(newIndex)),function() {console.log("Song Moved from Pos "+ String(oldIndex) +" to" + String(newIndex) +"MOVE MOVE MOVE MOVE");});
		}
		
	}

	//Update the song number in the playlist order
	function upSongNum(){
		mpd.send('currentsong', function(r){
			curSongNum=parseInt(mpd.response['Pos']);
			curTitle= mpd.response['Title'];
		});
	}

	//Update time variable in the html
	function upTime(){
		if(playlist.length>0){
			mpd.send('status', function(r){
				console.log(mpd.response['time']);
				var stime= mpd.response['time'].split(":");
				statusv = mpd.response['state'];
				curTime=parseInt(stime[0]);
				curSongLength=parseInt(stime[1]);
				var time= sec2min(curTime);
				curSongTime= sec2min(curSongLength);
		    	everyone.now.updateTime(curTime,curSongLength,time[0],time[1],curSongTime[0],curSongTime[1]);
			});
		}
		else{
			everyone.now.updateTime(0,0);
		}
	}

	//refresh information in the playlist
    function refreshInfo() {    	    
        everyone.now.setStatus(statusv);
	    upSongNum();
	    setTimeout(upPlaylist(everyone),350);
    }
    
    //Convert seconds to minutes
    function sec2min(time) {    	    
		var minutes = Math.floor(time / 60);
		var seconds = String(time - minutes * 60);
		if(seconds.length==1){
			seconds="0"+seconds;
		}
		return [minutes, seconds];	
    }
    
    //Reset the playlist
    function resetPlaylist() {
    		cSend("pause");
    		reorderPL();    	
		    cSend("seek 0 0");  
			voteCount = new Array();
			voteInfo = new Array();
			curTime=0;
			curSongNum=0;
			cSend("play");
    }
    
    //Update the status
    setInterval(function(){
	    if(statusv=='play' && seekBool==false) {
		    curTime++;
		    var time= sec2min(curTime);
		    everyone.now.updateTime(curTime,curSongLength,time[0],time[1],curSongTime[0],curSongTime[1]);
	    }
	    if (playlistSize!= -1 && curSongNum==playlistSize && curTime>(curSongLength+1)) {		
			//console.log("reseting");
			resetPlaylist();
	    }
  
    },1000);

	//Periodically update time
    setInterval(function(){upTime();},4700);
    
    //Refresh playlist info periodically
    setInterval(function(){refreshInfo();},8100);
