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

/*
 * Create server
 */
    var html = require('fs').readFileSync(__dirname+'/helloworld.html');
    var server = require('http').createServer(function(req, res){
        res.end(html);
    });
    server.listen(3000);

/*
 *  Variable declarations
 */
    var everyone = nowjs.initialize(server);
    var statusv= 'pause';
	var playlist = new Array();
	var curtime = 0;
	var cursonglen= 0;
	var cursongnum = 0;

/*
 * Functions
 */
    //Send command to mpd, log output to console
    function cSend(cmd) {
	    mpd.send(cmd,function(r) {
		    console.log(r);
	    });
    }

    //Logs output of exec to stdout (command line)
    function puts(error, stdout, stderr) { sys.puts(stdout) }
    
	everyone.now.setPlaylist=function(){
		playlist = new Array();
		mpd.send('playlist', function(input){
			var i = 0;
			while(input[String(i)] != undefined){		
				playlist.push(input[String(i)].substring(6,input[String(i)].length));
				i++;
			}
		});
		}
    // Server side logic to check current state of mpd
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
				if(cursongnum!=0) {cursongnum--;}		
		    }
		    else {
			    cSend('previous')
			    cSend('pause');
				if(cursongnum!=0) {cursongnum--;}
		    }		
		}
        else if(this.now.command=='next') {
		    if( this.now.status=='play') {
			    cSend('next');
				if(cursongnum!=playlist.length) {cursongnum++;}		
		    }
		    else {
			    cSend('next')
			    cSend('pause');
				if(cursongnum!=playlist.length) {cursongnum++;}	
		    }		
		}
	   
        everyone.now.setStatus(this.now.status);
        statusv=this.now.status;
		everyone.now.getPlaylist();
    }
      
    //Sets initial status for new clients  
    everyone.now.askStatus= function() {    	    
        this.now.setStatus(statusv);
		this.now.getPlaylist();		 
	}
   
		everyone.now.retPlaylist=function(){
				this.now.playlist=playlist;
				this.now.songnum = cursongnum;
		}
		everyone.now.setCurSongTime = function() {
			console.log('yes');
			mpd.send('currentsong', function(r){
    			//var s = String(r).split("\'");
				console.log('start');
				console.log(r);
			}); 
			mpd.on('Time', function(t){
				console.log(t);
				console.log('yeah')
			});
			//mpd.on('OK',function(){
			//	mps.send('playlist',function(){
				//	console.log(r);
				//	console.log('real end');
			//	});
			//});
			console.log('end');
		}


