/**
 * Among HTTP methods,  
 * 
 * some SHOULD have body (payload) in request, e.g.
 * - PATCH
 * - POST
 * - PUT
 * 
 * some SHOULD NOT have body (payload) in request, e.g.
 * - GET
 * - HEAD
 * 
 * some MAY have body (payload) in requeset, e.g.
 * - COPY
 * - DELETE
 * 
 * To make things easy, `htp` assumes that methods MAY or SHOULD NOT have body 
 * will take no payload in real. E.g.
 *   // The only object is regarded as headers instead of body.
 *   htp.copy('http://example.com/source.html', { Destination: '/target.html' });
 * If you wanna send body but no extra headers applied, place an empty placeholder as headers:
 *   htp.delete('http://example.com/source.html', null, { Backup: '/target.html' });
 */

module.exports = [
	'CONNECT',

	'COPY',

	/**
	 * See https://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.7
	 * Bodies on DELETE requests have no defined semantics.  Note that
     * sending a body on a DELETE request might cause some existing
     * implementations to reject the request.
	 */
	'DELETE',

	'GET',
	'HEAD',
	'OPTIONS',
	'TRACE',
	];
