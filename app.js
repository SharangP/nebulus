/*
 * NebulUs
 */

/*
 * Dependency variables
 */
    var sys = require('sys');
    var exec = require('child_process').exec;
    var mpdSocket = require('mpdsocket');
    var mpd = new mpdSocket('localhost','6600');
    var nowjs = require("now");
    var mysql = require("mysql");
    var databaseJavascript = require('./databaseJavascript');

/*
 * Create server

    var html = require('fs').readFileSync(__dirname+'/index.html');
    var server = require('http').createServer(function(req, res){
        res.end(html);
    });
    server.listen(2000);

/*
 *  Variable declarations

    var everyone = nowjs.initialize(server);
    var statusv= 'pause';
    var curSongNum = 0;
    var curTime=0;
    var curSongLength=0;
    var playlist = new Array();

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
    //Send command to mpd, log output to console
    function cSend(cmd) {
	    mpd.send(cmd,function() {
		    console.log('cSend called.');
	    });
    }

    //TEST DB STUFF
    //
    console.log('hello');
    databaseJavascript.syncDatabase('/home/pi/music');


/*
    //Server side logic to check current state of mpd
    everyone.now.checkValue = function() {
	    console.log(this.now.command);
        
        if(this.now.command=='play') {
		    cSend('play');
		}
        else if(this.now.command=='pause') {
		    cSend('pause');
		}
        else if(this.now.command=='prev') {
		    if( this.now.status=='play') {
			    cSend('previous');
				if(curSongNum!=0) {curSongNum--;}		
		    }
		    else {
			    cSend('previous')
			    cSend('pause');
				if(curSongNum!=0) {curSongNum--;}
		    }		
		}
        else if(this.now.command=='next') {
		    if( this.now.status=='play') {
			    cSend('next');
				if(curSongNum!=playlist.length) {curSongNum++;}		
		    }
		    else {
			    cSend('next')
			    cSend('pause');
				if(curSongNum!=playlist.length) {curSongNum++;}	
		    }		
		}
	   
        everyone.now.setStatus(this.now.status);
        statusv=this.now.status;
	    upPlaylist();
	    upSongNum();
	    setTimeout(everyone.now.getPlaylist(playlist,curSongNum), 500);
    }
      
    //Sets initial status for new clients  
    everyone.now.askStatus= function() {    	    
        this.now.setStatus(statusv);
	    upSongNum();
	    upPlaylist();
	    this.now.getPlaylist(playlist,curSongNum);		 
	}

 
	function upPlaylist(){
		//var asker= this;
		mpd.send('playlist', function(){
			var input = mpd.response;			
			var i = 0;
			playlist=[];
			while(input[String(i)] != undefined){		
				playlist.push(input[String(i)].substring(6,input[String(i)].length));
				i++;
			}
		    console.log(playlist);
			//asker.now.playlist=playlist;
			//playlist=[];
		});
	}

	function upSongNum(){
		//var asker= this;
		mpd.send('currentsong', function(r){
			curSongNum=parseInt(mpd.response['Pos']);
			curSongLength=parseInt(mpd.response['Time']);
			console.log(curSongNum);
			//asker.now.songnum = curSongNum;
		});
		//mpd.response['Pos'] ;

	}
	
    function upTime(){
		//var asker= this;
		mpd.send('currentsong', function(r){
			curSongNum=parseInt(mpd.response['Pos']);
			console.log(mpd.response);
			console.log(curSongNum);
			//asker.now.songnum = curSongNum;
		});
		//mpd.response['Pos'] ;

	}
 
    //Logs output of exec to stdout (command line)
    //function puts(error, stdout, stderr) { sys.puts(stdout) }
    
    //Set onscreen playlist for every client client view
	//everyone.now.setPlaylist=function(){
	//	playlist = new Array();
	//	mpd.send('playlist', function(){
	//		var input = mpd.response;			
	//		var i = 0;
	///		while(input[String(i)] != undefined){		
	//			playlist.push(input[String(i)].substring(6,input[String(i)].length));
	//			i++;
	//		}
	//	});
	//}
   
  /*  everyone.now.setCurSongTime = function() {
		console.log('yes');
		mpd.send('currentsong', function(r){
    	    //var s = String(r).split("\'");
		    console.log('start');
	var str2 = mpd.response;
		console.log(str2);
		}); 
	mpd.send('status', function(r){
    	    //var s = String(r).split("\'");
		    console.log('start');
		    console.log(r);
	var str2 = mpd.response;
		console.log(str2);
		}); 
	mpd.send('playlist', function(r){
    	    //var s = String(r).split("\'");
		    console.log('start');
		    console.log(r);
	var str2 = mpd.response;
		console.log(str2);
		}); 
	
      //  mpd.on('Time', function(t){
	//		console.log(t);
	//		console.log('yeah')
	//	});
			
        //mpd.on('OK',function(){
		//	mps.send('playlist',function(){
			//	console.log(r);
			//	console.log('real end');
		//	});
		//});
		
        console.log('end');
	}
*/

