const NodeCache = require( "node-cache" );
const cache = new NodeCache({ stdTTL: 3600-60, checkperiod: 60 });

cache.set('test', { number: 1 });
console.log(cache.get('test'));