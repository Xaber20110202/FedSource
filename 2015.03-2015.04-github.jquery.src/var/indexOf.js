define([
	"./arr"
], function( arr ) {
	// 同理 var/arr模块的array也不应被修改
	return arr.indexOf;
});
