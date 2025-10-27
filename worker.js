export default {

    async fetch(request, env, context) {

        console.log('start');

        const HOST = 'www.com';

        const GET_SKIP_CACHE = 'skipcache';

        // URLs will not be cached
        var BYPASS_URL = [
            'order',
            'thanks',
            'sql',
            'onestepcheckout',
            'admin',
            'checkout',
            'catalogsearch',
            'paypal',
            'cart',
            'static/',
            'media/',
            'api',
            'rest/',
            'ajax',
            'frontend_action',
            'searchspring',
            'customer',
            'compare',
            'tracking',
            'account',
            'feedonomics',
            'estimateddeliverydate',
            'original-page',
            'connector/email',
            'blog',
            'design',
            'aln',
            'section',
            'form',
            'compare',
            'like',
            'search',
            'rest',
            'index.php',
            'wp-content/uploads',
            'ajax',
            'Ajax',
            '/catalog',
            'export',
            'import',
            'p=',
            'price',
            'success',
            'result'
        ];

        var SKIP_FOR_COOKIES = [
            "X-Magento-Vary",
        ];


        var TYPE_FOR_CACHE = [
            "ProductOutOfStock",
            "Product",
            "Category",
            "CMS",
            "CMS-Home"
        ];

        var TYPE_FOR_CACHE_FILTER = [
            "CategoryFilter"
        ];

        var TYPE_FOR_CACHE_ARCHIVE = [
            "ProductArchive"
        ];

        try {

            if (request.method && request.method != 'GET') {
                let response1 = await fetch(request);
                return response1;
            }


            if (request.method && request.method == 'GET') {

                const requestUrl = request.url.toString();

                const url = new URL(requestUrl);


                /**
                 * Skip cache CACHE HTML for BYPASS_URL list
                 */
                if (BYPASS_URL && BYPASS_URL.length) {
                    let searchUrl = url.pathname + url.search;

                    for (let pass of BYPASS_URL) {
                        // See if the URL starts with any of the logged-in user prefixes
                        //console.log("check: " + pass);

                        if (searchUrl.indexOf(pass) >= 0) {
                            console.log("Should Bypass URL:" + pass);
                            let response1 = await fetch(request);
                            return response1;
                        }
                    }
                }

                /**
                 * Skip cache GET param
                 */
                const params = url.searchParams;

                if (params.has(GET_SKIP_CACHE)) {
                    console.log('Skip CACHE HTML')
                    let response1 = await fetch(request);
                    return response1;
                }



                const cookieHeader = request.headers.get('cookie');
                if (cookieHeader && cookieHeader.length && SKIP_FOR_COOKIES.length) {
                    const cookies = cookieHeader.split(';');
                    for (let cookie of cookies) {
                        // See if the cookie starts with any version prefixes
                        for (let key of SKIP_FOR_COOKIES) {
                            if (cookie.trim().startsWith(key)) {
                                console.log('Skip CACHE - Cookies');
                                let response1 = await fetch(request);
                                return response1;
                            }
                        }
                    }
                }

                if (params.has(GET_SKIP_CACHE)) {
                    console.log('Skip CACHE HTML')
                    let response1 = await fetch(request);
                    return response1;
                }


                const pathName = url.pathname;

                //url.searchParams('skiphtmlcache');

                if (pathName) {

                    let urlPath = url.pathname.slice(1);
                    let urlPathString = urlPath.toString();

                    /**
                     * KEY CACHE in R2
                     */
                    let keyCache = urlPathString.split("/").join("_");
                    keyCache = keyCache.split(".").join("_");

                    if (keyCache.length === 0) {
                        keyCache = '_';
                    }

                    keyCache = keyCache + '_-_';


                    console.log('check R2');
                    console.log(keyCache);

                    let r2cache = null;

                    r2cache = await env.R2.get(keyCache);

                    /**
                     * Search
                     */
                    /*
                    const options = {
                        limit: 10,
                        prefix: keyCache,
                        include: [],
                      };

                    const listed = await env.R2.list(options);

                    if (listed.objects.length === 1) {
                        console.log('search  - ok');
                        console.log(listed.objects[0].key);
                        r2cache = await env.R2.get(listed.objects[0].key);
                    }
                    */


                    let r2cachetest = null;

                    if (r2cache !== null) {

                        //console.log(r2cache.body)
                        //console.log('HTML added: ' + r2cache.uploaded);

                        /**
                         * Return from CACHE
                         */
                        return returnCachedR2(r2cache);
                    }


                    /**
                     * Check R2 cache for filter pages
                     */
                    r2cache = await env.R2filter.get(keyCache);
                    if (r2cache !== null) {
                        console.log('filter page cache - exist');
                        /**
                         * Return from CACHE
                         */
                        return returnCachedR2(r2cache);
                    }

                    /**
                     * Redirect check KV storage
                     */
                    let urlWithoutParamsNormal = request.url.split("?")[0];
                    const kvRerirectExistValue = await env.KV_REDIRECT.get(urlWithoutParamsNormal);
                    if (kvRerirectExistValue !== null) {
                        console.log('KV redirect exist');
                        return Response.redirect(kvRerirectExistValue, 301);
                    }



                    /**
                     * Check R2 cache for Archive pages
                     */
                    let keyCacheArchive = keyCache + 'productarchive';
                    r2cache = await env.R2archive.get(keyCacheArchive);
                    if (r2cache !== null) {
                        console.log('archive page cache - exist');
                        /**
                         * Return from CACHE
                         */
                        return returnCachedR2(r2cache);
                    }









                    /**
                     * Try normal request
                     */


                    // if(request.headers.has('cookie')) {
                    // 	console.log(request.headers.entries());
                    // 	for (const pair of request.headers.entries()) {
                    // 		console.log(`${pair[0]}: ${pair[1]}`);
                    // 	  }
                    // 	// console.log(request.headers.get('cookie'));
                    // 	// request.headers.append("cookie", "");
                    // }


                    /**
                     * Set new Header without Cookies for skip bug LOGGED user
                     */
                    const newHeaders = new Headers();
                    newHeaders.set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                    newHeaders.append("accept-encoding", "gzip, br");
                    newHeaders.append("connection", "Keep-Alive");
                    newHeaders.append("host", HOST);


                    let urlWithoutParams = request.url.split("?")[0];
                    let response1 = await fetch(urlWithoutParams, {
                        method: "GET",
                        headers: newHeaders,
                    });

                    let status = response1.status;
                    let redirected = response1.redirected ?? false;

                    //console.log(response1.url);

                    // console.log('Status');
                    // console.log(urlWithoutParams);
                    // console.log(status);
                    // console.log(redirected);
                    // console.log(response1);
                    // console.log(response1.url);

                    let redirectResponse = false;
                    let redirectUrl = null;

                    if (redirected === true) {
                        redirectResponse = true;
                        redirectUrl = response1.url;
                    }


                    if (status && status === 200 && redirected == false) {

                        let contentType = response1.headers.get('Content-Type');

                        if (contentType && contentType.includes('text/html') && response1.headers.has('X-Type')) {


                            let canAddToCache = false;
                            let canAddToCacheFilter = false;
                            let canAddToCacheArchive = false;


                            if (TYPE_FOR_CACHE && TYPE_FOR_CACHE.length) {
                                let xTypeHeader = response1.headers.get('X-Type');

                                console.log('X-Type:' + xTypeHeader);
                                for (let type_page of TYPE_FOR_CACHE) {
                                    //console.log(type_page);
                                    if (type_page === xTypeHeader) {
                                        canAddToCache = true;
                                        console.log('Need add to Cache.');
                                    }
                                }
                            }


                            if (canAddToCache === false && TYPE_FOR_CACHE_FILTER && TYPE_FOR_CACHE_FILTER.length) {
                                let xTypeHeader = response1.headers.get('X-Type');

                                console.log('X-Type:' + xTypeHeader);
                                for (let type_page of TYPE_FOR_CACHE_FILTER) {
                                    //console.log(type_page);
                                    if (type_page === xTypeHeader) {
                                        canAddToCacheFilter = true;
                                        console.log('Need add to Cache Filter Page.');
                                    }
                                }
                            }


                            if (canAddToCache === false && canAddToCacheFilter === false && TYPE_FOR_CACHE_ARCHIVE && TYPE_FOR_CACHE_ARCHIVE.length) {
                                let xTypeHeader = response1.headers.get('X-Type');

                                console.log('X-Type:' + xTypeHeader);
                                for (let type_page of TYPE_FOR_CACHE_ARCHIVE) {
                                    //console.log(type_page);
                                    if (type_page === xTypeHeader) {
                                        canAddToCacheArchive = true;
                                        console.log('Need add to Cache Archive Page.');
                                    }
                                }
                            }




                            if (canAddToCache === true) {
                                const response2 = response1.clone();

                                let html = await response2.text();

                                console.log(response1.headers.get('X-Type'));

                                //keyCache = keyCache + response1.headers.get('X-Type');
                                keyCache = keyCache.toLowerCase();

                                console.log(keyCache);

                                /**
                                 * Add to R2 Cache
                                 */
                                context.waitUntil(env.R2.put(keyCache, html, {
                                    onlyIf: request.headers,
                                    httpMetadata: request.headers
                                }));

                                console.log('A - new content added to cache.');

                                /**
                                 * Return not from CACHE
                                 */
                                const headers = new Headers();
                                headers.set('CDN-Cached', 'A');

                                let response5 = new Response(response1.body, {headers,});

                                return response5;
                            } else if (canAddToCacheFilter === true) {

                                const response2 = response1.clone();
                                let html = await response2.text();

                                /**
                                 * Add to R2 Cache
                                 */
                                console.log('Filter page to cache');
                                addCache(context, env.R2filter, request, keyCache, html);

                                /**
                                 * Return not from CACHE
                                 */
                                const headers = new Headers();
                                headers.set('CDN-Cached', 'A');

                                let response5 = new Response(response1.body, {headers,});

                                return response5;

                            } else if (canAddToCacheArchive === true) {

                                const response2 = response1.clone();
                                let html = await response2.text();

                                /**
                                 * Add to R2 Cache
                                 */
                                console.log('Archive page to cache');
                                keyCache = keyCache + 'productarchive';
                                addCache(context, env.R2archive, request, keyCache, html);

                                /**
                                 * Return not from CACHE
                                 */
                                const headers = new Headers();
                                headers.set('CDN-Cached', 'A');

                                let response5 = new Response(response1.body, {headers,});

                                return response5;

                            } else {
                                console.log('NOT Need add to Cache.');
                            }

                        }

                        console.log('Not HTML content. Not Cached.');
                    }

                    if (redirectResponse === true) {
                        console.log('Redirect url: ' + redirectUrl);

                        /**
                         * Save to KV
                         */
                        await env.KV_REDIRECT.put(urlWithoutParams, redirectUrl);

                        let responseRedirect = await fetch(request);
                        return responseRedirect;
                    }

                    return response1;
                }
            }
        } catch (e) {

        }

        let response3 = await fetch(request);
        return response3;
    },

};

function returnCachedR2(cachedata)
{
    const headers = new Headers();
    headers.set('CDN-Cached', 'Y');
    headers.set('CDN-Cache-Uploaded', cachedata.uploaded ?? '');

    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Content-Type', 'text/html; charset=UTF-8');
    headers.set('X-Content-Type-Options', 'nosniff');

    let responseR2Cache = new Response(cachedata.body, {headers,});
    responseR2Cache.headers.set('Content-Encoding', 'gzip');

    console.log('From R2 CACHE');

    return responseR2Cache;
}

function addCache(context, r2, request, keyCache, html)
{
    keyCache = keyCache.toLowerCase();

    /**
     * Add to R2 Cache
     */
    context.waitUntil(r2.put(keyCache, html, {
        onlyIf: request.headers,
        httpMetadata: request.headers
    }));

    console.log('Added to cache page with key - ' + keyCache);

}