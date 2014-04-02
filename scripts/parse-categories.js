var utils = require('./utils.js');

var parseDatabase = function(version) {
	var symbolMap = {};
	var bidiMap = {};
	var source = utils.readDataFile(version, 'database');
	if (!source) {
		return;
	}
	var lines = source.split('\n');
	var flag = false;
	var first = 0;
	lines.forEach(function(line) {
		var data = line.trim().split(';');
		var codePoint = parseInt(data[0], 16);
		var name = data[1];
		var generalCategory = data[2];
		var bidiCategory = data[4];
		if (flag) {
			if (/<.+, Last>/.test(name)) {
				flag = false;
				utils.range(first, codePoint).forEach(function(value) {
					symbolMap[value] = generalCategory;
					bidiMap[value] = bidiCategory;
				});
			} else {
				throw Error('Database exception');
			}
		} else {
			if (/<.+, First>/.test(name)) {
				flag = true;
				first = codePoint;
			} else {
				symbolMap[codePoint] = generalCategory;
				bidiMap[codePoint] = bidiCategory;
			}
		}
	});

	// http://unicode.org/reports/tr44/#GC_Values_Table
	// http://unicode.org/reports/tr18/#Categories
	var categoryMap = {};
	var categories = [];
	var tmp;
	utils.range(0x000000, 0x10FFFF).forEach(function(codePoint) {
		// Note: `Any`, `ASCII`, and `Assigned` are actually properties,
		// not categories. http://unicode.org/reports/tr18/#Categories
		if (!symbolMap.hasOwnProperty(codePoint)) {
			categories = ['Any', 'C', 'Cn'];
		} else {
			tmp = symbolMap[codePoint];
			categories = ['Any', tmp, tmp.charAt(0), 'Assigned'];
			if (/^(?:Ll|Lu|Lt)$/.test(tmp)) {
				categories.push('LC');
			}
			if (codePoint <= 0x7F) {
				categories.push('ASCII');
			}
		}
		if (bidiMap[codePoint]) {
			categories.push('Bidi_' + bidiMap[codePoint]);
		}
		categories.forEach(function(category) {
			utils.append(categoryMap, category, codePoint);
		});
	});
	return categoryMap;
};

module.exports = parseDatabase;
