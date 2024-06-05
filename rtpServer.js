const dgram = require("dgram");
const EventEmitter = require("events");

const NO_DATA_TIMEOUT = 10000;

class RtpServer {

    constructor() {
        this.eventEmitter = new EventEmitter();

        this.ssrcs = {};
    }

    resetTimerFor(ssrc) {
    	if(this.ssrcs[""+ssrc]!=null) {
    		clearTimeout(this.ssrcs[""+ssrc]);
    	}
        this.ssrcs[""+ssrc] = setTimeout(() => {
            this.eventEmitter.emit("disconnect", ssrc);
            if(this.ssrcs[""+ssrc]!=null) delete this.ssrcs[""+ssrc];
        }, NO_DATA_TIMEOUT);
    }

    start(port) {

        const server = dgram.createSocket('udp4');

        server.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            server.close();
        });

        server.on('message', (msg, rinfo) => {
            const buff = Buffer.from(msg);
            const firstByte = buff.readUInt8(0);
            const csrcListLen = firstByte % 16;
            const ssrc = buff.readUInt32BE(8);
            const actualBuffer = buff.slice(4+4+4+(csrcListLen*4));
            if(this.ssrcs[""+ssrc]==null) {
            	this.eventEmitter.emit("connect", ssrc);
            }
            for(let i=0;i<actualBuffer.length;i+=2) {
                const first = actualBuffer[i];
                actualBuffer[i] = actualBuffer[i+1];
                actualBuffer[i+1] = first;
            }
            this.eventEmitter.emit("data", actualBuffer, ssrc);
            this.resetTimerFor(ssrc);
            //console.log(`server got: ${actualBuffer.length}/${buff.length} from ${rinfo.address}:${rinfo.port} ssrc: ${ssrc}`, actualBuffer);
        });

        server.on('listening', () => {
            const address = server.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });

        server.bind(port);

    }

}

module.exports = RtpServer;