define(function() {
	// 用于 string.match(rnotwhite)
	// 'xx'.match(rnotwhite) --> ['xx']
	// '  '.match(rnotwhite) --> null
	// 附加作用［可能实际作用就是］：将字符串包装成数组
	return (/\S+/g);
});
