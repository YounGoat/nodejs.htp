module.exports = [
	'CONNECT',

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
	'TRACE'
	];
