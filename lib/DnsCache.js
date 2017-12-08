'use strict';

const MODULE_REQUIRE = 1
    /* built-in */
    
    /* NPM */
    
    /* in-package */
    ;

function DnsCache(ttl) {
    this.ttl = ttl;
    this.caches = {};
}

DnsCache.prototype.write = function(hostname, info) {
    this.caches[hostname] = { info, time: Date.now() };
};

DnsCache

module.exports = DnsCache;