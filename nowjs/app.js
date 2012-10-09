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
    var html = require('fs').readFileSync(__dirname+'/index.html');
    var server = require('http').createServer(function(req, res){
        res.end(html);
    });
    server.listen(8080);

/*
 *  Variable declarations
 */
    var everyone = nowjs.initialize(server);
    var statusv= 'pause';

/*
 * Functions
 */
    //Send command to mpd, log output to console
    function cSend(cmd) {
	    mpd.send(cmd,function(r) {
		    console.log(r);
	 l   });
    }

    //Logs output of exec to stdout (command line)
    function puts(error, stdout, stderr) { sys.puts(stdout) }
    
 
    // Server side logic to check current state of mpd
    everyone.now.checkValue = function() {
	    console.log(this.now.command);
	    cSend('status');
        
        if(this.now.command=='play') {
		    cSend('play');
		}
        else if(this.now.command=='pause') {
		    cSend('pause');
		}
        else if(this.now.command=='prev') {
		    if( this.now.status=='play') {
			    cSend('previous');		
		    }
		    else {
			    cSend('previous')
			    cSend('pause');
		    }		
		}
        else if(this.now.command=='next') {
		    if( this.now.status=='play') {
			    cSend('next');		
		    }
		    else {
			    cSend('next')
			    cSend('pause');
		    }		
		}
	   
        everyone.now.setStatus(this.now.status);
        statusv=this.now.status;
    }
      
    //Sets initial status for new clients  
    everyone.now.askStatus= function() {
        mpd.send('status', function(r){
            var stringsplit = r.split("\'");
            statusv = stringsplit[21];
        })    	    
        this.now.setStatus(statusv);
    }   
