module.exports = Enum;

function Enum() {
	this._idxStart = 1;
	this._idxCurrent = 1;
}

Enum.prototype = Object.create(null);
Enum.prototype.add = function(name, value) {
	this[name] = new EnumKey(name, value);
	return this;
};
Enum.prototype.get = function(value) {
	var o = undefined;
	Object.keys(this).forEach((v, k, a) => {
		if (this[v] == value)
			o = this[v];
	});
	return o;
};
Object.freeze(Enum.prototype);


function EnumKey(name, value) {
	this.name = name;
	this.value = value;
}

EnumKey.prototype = Object.create(null);
EnumKey.prototype.toString = function() {
	return this.name;
};
EnumKey.prototype.valueOf = function() {
	return this.value;
};
Object.freeze(EnumKey.prototype);
