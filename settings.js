// Unit: milli-second
module.exports = {

	// Whether to return the response stream 
	"piping" : false,

	// When set true, htp will not stage response body in piping mode.
	"pipingOnly": false,

	// Default protocol.
	"protocol": "http:",

	// Whether to reject unsecure response.
	"rejectUnauthorized": true,

	// Time used to finish the whole request.
	// ATTENTION: Time used to hostname resolving test is included.
	// dns.lookup() -- "end" event
	"request_timeout"  : 120000,

	// Time used to resolve hostname.
	// dns.lookup() -- address returned
	"dns_timeout"      :   5000,

	// DNS TTL.
	"dns_ttl"          : 600000,

	// Time used to plug into socket.
	// http(s).request() -- "socket" event
	"plugin_timeout"   :    100,

	// Time used to shake-hands with target server.
	// "socket" event -- "connect" event
	"connect_timeout"  :  30000,

	// Time used to recieve the first response from target server.
	// "connect" event -- first "data" event (first data chunk arrives)
	"response_timeout" :  15000,

	// Time between two data chunks.
	"chunk_timeout"    :   5000,

	// Time used to receive all data.
	// "connect" event -- "end" event (all data chunks arrive)
	"data_timeout"     :  60000,
};
