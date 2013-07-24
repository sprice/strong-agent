function debug (format, args) {
	if (/cpuprof/.test(process.env.NODEFLY_DEBUG) ) {
		console.log.apply(console, ['CPU PROFILER: ' + format].concat(args || []));
	}
}

function populateChildren (source, dest) {
	_(_.keys(source)).each(function (key) {
		dest[key] = source[key];
	});

	if (source.rootPath) {
		dest.scriptName = dest.scriptName.replace(source.rootPath, '');
	}

	if (source.childrenCount) {
		dest.children = [];

		for (var i = 0; i < source.childrenCount; i++) {
			var child = source.getChild(i)
				, newChild = _.clone(child);

			populateChildren(child, newChild);
			dest.children.push(newChild);
		}
	}
}

var profile = require('nodefly-v8-profiler')
	, _ = require('underscore');

exports.start = function () {
	debug('Started cpu profiling');
	profile.startProfiling('nodefly-cpu-profile');
};

exports.stop = function (callback) {
	var prof = profile.stopProfiling('nodefly-cpu-profile');

	var result = _.clone(prof.topRoot);
	result.rootPath = __dirname;
	populateChildren(prof.topRoot, result);
	debug('Completed cpu profiling');
	callback && callback(result);
};