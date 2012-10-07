var html = require('fs').readFileSync(__dirname+'/helloworld.html');
var server = require('http').createServer(function(req, res){
  res.end(html);
});
server.listen(8080);
var sys = require('sys');
var exec = require('child_process').exec;
var mpdSocket = require('mpdsocket');
var mpd = new mpdSocket('localhost','6600');

	mpd.send('play',function(r) {
		console.log(r);
    });

function puts(error, stdout, stderr) { sys.puts(stdout) }
function putsval(error, stdout, stderr) { sys.puts(stderr); statusv=stdout}
var nowjs = require("now");
var everyone = nowjs.initialize(server);
var statusv;
 // Server side
 everyone.now.checkValue = function() {
      console.log(this.now.command); 
      if(this.now.command=='play') {
		exec("/home/pi/nebulus/play.py",puts);
		}
      else if(this.now.command=='pause') {
		exec("/home/pi/nebulus/pause.py",puts)
		}
      else if(this.now.command=='prev') {
		exec("/home/pi/nebulus/prev.py",puts);
		}
      else if(this.now.command=='next') {
		exec("/home/pi/nebulus/next.py",puts);
		}
	
	everyone.now.setStatus(this.now.status)
	statusv=this.now.status;
 }
everyone.now.askStatus= function() {
	this.now.setStatus(statusv);
}
	





